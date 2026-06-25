import type { Attendance, AttendanceDay } from "@/types";
import {
  computeLiveRegisterLeaveEntitlements,
  LIVE_REGISTER_DAYS_PER_CL,
  LIVE_REGISTER_DAYS_PER_EL,
  LIVE_REGISTER_DAYS_PER_FL,
} from "@/lib/liveRegisterLeaveEntitlements";
import { attendanceService } from "@/services/attendance.service";

/**
 * Strict, calendar-year-to-date enforcement of EL / CL / FL entitlements.
 *
 * The live-register rule (see {@link computeLiveRegisterLeaveEntitlements}) is the
 * single source of truth for how many paid leaves an employee has "earned":
 *   EL = floor(totalPresentDays / 20)
 *   CL = ceil (totalPresentDays / 35)
 *   FL = floor(totalPresentDays / 60)
 *
 * This module validates an *in-progress* attendance save against that rule by
 * summing all persisted months in the same calendar year, swapping in the edited
 * month, and checking that the proposed EL/CL/FL totals fit within the cap.
 *
 * "totalPresentDays" here matches what is stored as `Attendance.presentDays`
 * (Present = 1, Half Day = 0.5, NH = 1). NH is a paid national holiday and is
 * already included in presentDays via {@link getAttendanceSliceForWorkOrder}.
 */

export interface LeaveValidationFailure {
  /** One-line error text safe to show in a toast. */
  message: string;
  /** Additional per-bucket details for callers that want a dialog list. */
  details: Array<{
    bucket: "EL" | "CL" | "FL";
    used: number;
    entitled: number;
    required: number;
  }>;
}

export type LeaveValidationResult =
  | { ok: true }
  | { ok: false; failure: LeaveValidationFailure };

function countFromDays(days: AttendanceDay[] | undefined): {
  presentDays: number;
  earnedLeaves: number;
  casualLeaves: number;
  festivalLeaves: number;
} {
  let presentDays = 0;
  let earnedLeaves = 0;
  let casualLeaves = 0;
  let festivalLeaves = 0;
  for (const d of days ?? []) {
    switch (d.status) {
      case "Present":
      case "NH":
        presentDays += 1;
        break;
      case "Half Day":
        presentDays += 0.5;
        break;
      case "Earned Leave":
        earnedLeaves += 1;
        break;
      case "Casual Leave":
        casualLeaves += 1;
        break;
      case "Festival Leave":
        festivalLeaves += 1;
        break;
      default:
        break;
    }
  }
  return { presentDays, earnedLeaves, casualLeaves, festivalLeaves };
}

export interface YtdLeaveTotals {
  presentDays: number;
  earnedLeaves: number;
  casualLeaves: number;
  festivalLeaves: number;
}

/**
 * Sum a year's worth of attendance, substituting the edited month's day array
 * for whatever is currently persisted (or inserting it if no record exists yet).
 */
export function computeYtdLeaveTotals(args: {
  allAttendancesForYear: Attendance[];
  employeeId: string;
  editedMonth: number;
  editedDays: AttendanceDay[];
}): YtdLeaveTotals {
  const { allAttendancesForYear, employeeId, editedMonth, editedDays } = args;
  const totals: YtdLeaveTotals = {
    presentDays: 0,
    earnedLeaves: 0,
    casualLeaves: 0,
    festivalLeaves: 0,
  };

  for (const record of allAttendancesForYear) {
    if (record.employee !== employeeId) continue;
    if (record.month === editedMonth) continue; // replaced below
    const m = countFromDays(record.days);
    totals.presentDays += m.presentDays;
    totals.earnedLeaves += m.earnedLeaves;
    totals.casualLeaves += m.casualLeaves;
    totals.festivalLeaves += m.festivalLeaves;
  }

  const edited = countFromDays(editedDays);
  totals.presentDays += edited.presentDays;
  totals.earnedLeaves += edited.earnedLeaves;
  totals.casualLeaves += edited.casualLeaves;
  totals.festivalLeaves += edited.festivalLeaves;

  return totals;
}

/**
 * Validate a pending save. Returns `{ ok: true }` when within entitlement,
 * otherwise returns a `failure` whose `message` is a toast-friendly sentence.
 *
 * A failure is surfaced as soon as any one bucket is over-granted; the `details`
 * array lists every violation so a richer UI can show all of them at once.
 */
export function validateLeaveEntitlement(args: {
  allAttendancesForYear: Attendance[];
  employeeId: string;
  editedMonth: number;
  editedDays: AttendanceDay[];
}): LeaveValidationResult {
  const totals = computeYtdLeaveTotals(args);
  const entitlement = computeLiveRegisterLeaveEntitlements(totals.presentDays);

  const failures: LeaveValidationFailure["details"] = [];
  if (totals.earnedLeaves > entitlement.earnedLeave) {
    failures.push({
      bucket: "EL",
      used: totals.earnedLeaves,
      entitled: entitlement.earnedLeave,
      required:
        (totals.earnedLeaves - entitlement.earnedLeave) * LIVE_REGISTER_DAYS_PER_EL,
    });
  }
  if (totals.casualLeaves > entitlement.casualLeave) {
    failures.push({
      bucket: "CL",
      used: totals.casualLeaves,
      entitled: entitlement.casualLeave,
      required:
        (totals.casualLeaves - entitlement.casualLeave) * LIVE_REGISTER_DAYS_PER_CL,
    });
  }
  if (totals.festivalLeaves > entitlement.festivalLeave) {
    failures.push({
      bucket: "FL",
      used: totals.festivalLeaves,
      entitled: entitlement.festivalLeave,
      required:
        (totals.festivalLeaves - entitlement.festivalLeave) * LIVE_REGISTER_DAYS_PER_FL,
    });
  }

  if (failures.length === 0) return { ok: true };

  const parts = failures.map(
    (f) =>
      `${f.bucket}: granted ${f.used} but only ${f.entitled} entitled`,
  );
  return {
    ok: false,
    failure: {
      message: `Cannot save — leave limit exceeded (${parts.join("; ")}). Entitlement is computed from year-to-date present days.`,
      details: failures,
    },
  };
}

/**
 * Convenience wrapper: fetch the entire calendar year's attendance for the given
 * employee directly from Firestore (bypassing the Redux store so validation does
 * not clobber the current filter) and run {@link validateLeaveEntitlement}.
 */
export async function fetchAndValidateLeaveEntitlement(args: {
  employeeId: string;
  year: number;
  editedMonth: number;
  editedDays: AttendanceDay[];
}): Promise<LeaveValidationResult> {
  const { employeeId, year, editedMonth, editedDays } = args;
  const records = await attendanceService.getByFilter({ employeeId, year });
  return validateLeaveEntitlement({
    allAttendancesForYear: records,
    employeeId,
    editedMonth,
    editedDays,
  });
}
