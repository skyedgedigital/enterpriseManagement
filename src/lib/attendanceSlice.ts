import type { Attendance, AttendanceDay } from "@/types";

export interface AttendanceWorkOrderSlice {
  /** Days belonging to the requested work order (or all days if workOrderId is null). */
  days: AttendanceDay[];
  presentDays: number;
  halfDays: number;
  earnedLeaves: number;
  casualLeaves: number;
  festivalLeaves: number;
}

/**
 * Returns the subset of a monthly attendance record that belongs to a given work order.
 *
 * Each `AttendanceDay` may carry its own `workOrderHr`. When absent, we fall back to
 * the record-level `workOrderHr` (legacy untagged data). If `workOrderId` is null or
 * empty, every day is returned (accumulated view across all work orders).
 *
 * All counts (presentDays, EL/CL/FL, halfDays) are derived from the filtered slice
 * so they cannot double-count a day that belongs to another work order.
 */
export function getAttendanceSliceForWorkOrder(
  attendance: Attendance | null | undefined,
  workOrderId: string | null | undefined,
): AttendanceWorkOrderSlice {
  const empty: AttendanceWorkOrderSlice = {
    days: [],
    presentDays: 0,
    halfDays: 0,
    earnedLeaves: 0,
    casualLeaves: 0,
    festivalLeaves: 0,
  };
  if (!attendance || !Array.isArray(attendance.days)) return empty;

  const recordLevelTag = attendance.workOrderHr ?? undefined;
  const filterByWorkOrder = Boolean(workOrderId);

  const filtered = filterByWorkOrder
    ? attendance.days.filter((d) => {
        const tag = d.workOrderHr ?? recordLevelTag ?? undefined;
        return tag === workOrderId;
      })
    : [...attendance.days];

  let presentDays = 0;
  let halfDays = 0;
  let earnedLeaves = 0;
  let casualLeaves = 0;
  let festivalLeaves = 0;

  for (const d of filtered) {
    switch (d.status) {
      case "Present":
        presentDays += 1;
        break;
      case "NH":
        // National holidays are paid leaves: they count as a full paid day in
        // the slice so downstream wage math (basic+DA, PF, ESI, incentive,
        // weekly allowance) includes them as if the worker was present.
        presentDays += 1;
        break;
      case "Half Day":
        presentDays += 0.5;
        halfDays += 1;
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

  return {
    days: filtered,
    presentDays,
    halfDays,
    earnedLeaves,
    casualLeaves,
    festivalLeaves,
  };
}

/** Effective work-order tag for a specific day, applying record-level fallback. */
export function getDayWorkOrderTag(
  day: AttendanceDay,
  attendance: Attendance | null | undefined,
): string | undefined {
  if (day.workOrderHr && day.workOrderHr.trim() !== "") return day.workOrderHr;
  const recTag = attendance?.workOrderHr;
  return recTag && recTag.trim() !== "" ? recTag : undefined;
}
