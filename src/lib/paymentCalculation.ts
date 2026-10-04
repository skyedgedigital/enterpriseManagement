import type { AttendanceDay } from "@/types";
import { roundNearestInteger, roundHalfUp2 } from "@/lib/moneyRounding";

/**
 * Payable attendance days from attendance: two half days = one full day.
 * Present=1, Half Day=0.5, NH=1 (national holiday is a paid leave and therefore
 * contributes a full day to payable attendance). All other statuses=0
 * (aligned with saved presentDays).
 */
export function getPaidDaysFromAttendance(days: AttendanceDay[]): number {
  let total = 0;
  for (const d of days) {
    switch (d.status) {
      case "Present":
      case "NH":
        total += 1;
        break;
      case "Half Day":
        total += 0.5;
        break;
      default:
        total += 0;
        break;
    }
  }
  return total;
}

export interface WeeklyAllowanceSummary {
  continuousWeeks: number;
  weeklyAllowanceDays: number;
  weeklyAllowanceAmount: number;
}

/** Weekly allowance rate: Rs. 1.40 per complete week (not per day). */
const WEEKLY_ALLOWANCE_PER_WEEK = 1.4;

function isWorkedStatus(status: AttendanceDay["status"]): boolean {
  // NH (National Holiday) is a paid leave and is treated like Present for the
  // continuous-week streak: the employee is "paid" for the day so the week is
  // not interrupted by the holiday.
  return status === "Present" || status === "Half Day" || status === "NH";
}

function isSunday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 0;
}

/**
 * Computes how many complete 7-day continuous work streaks exist in a month.
 * Sunday is treated as the weekly holiday: it does not break the streak and
 * counts as part of the week (e.g. Mon–Sat present + Sunday leave = 1 full week).
 * Each complete week contributes Rs. 1.40 (rate is per week, not per day).
 *
 * @param days - Attendance days for the month (each has day 1–31 and status)
 * @param year - Calendar year (required for Sunday detection)
 * @param month - Calendar month 1–12 (required for Sunday detection)
 */
export function getWeeklyAllowanceSummaryFromAttendance(
  days: AttendanceDay[],
  year: number,
  month: number,
): WeeklyAllowanceSummary {
  let continuousWeeks = 0;
  let streak = 0;

  const applyStreak = () => {
    const weeksInStreak = Math.floor(streak / 7);
    if (weeksInStreak > 0) {
      continuousWeeks += weeksInStreak;
      streak = streak % 7;
    }
  };

  for (const d of days) {
    const dayIsSunday = isSunday(year, month, d.day);
    if (isWorkedStatus(d.status)) {
      streak += 1;
      continue;
    }
    if (dayIsSunday) {
      // Sunday is weekly holiday: counts as part of the week, does not break streak
      streak += 1;
      continue;
    }
    applyStreak();
    streak = 0;
  }
  applyStreak();

  const weeklyAllowanceDays = continuousWeeks * 7;
  return {
    continuousWeeks,
    weeklyAllowanceDays,
    weeklyAllowanceAmount: continuousWeeks * WEEKLY_ALLOWANCE_PER_WEEK,
  };
}

export interface PaymentBreakdown {
  /** Number of days the worker is present */
  totalWorkingDays: number;
  /** (Basic + DA) * totalWorkingDays */
  resultant1: number;
  /** Resultant1 + otherCash + allowances + overtime */
  resultant2: number;
  /** 12% of min(resultant1, 15,000), rounded to whole rupees. */
  pf: number;
  /** 0.75% of resultant2, rounded to whole rupees. */
  esi: number;
  /** Rounded to two decimal places. */
  otherDeduction: number;
  /**
   * Gross minus whole-rupee PF/ESI and two-decimal other deductions,
   * rounded to whole rupees. The net rounding adjustment is at most 0.50.
   */
  netPayment: number;
  /** Per-day basic rate (unchanged) */
  basic: number;
  /** Per-day DA rate (unchanged) */
  da: number;
  /** Rounded to two decimal places. */
  otherCash: number;
  allowances: number;
  overtime: number;
  /** Raw values retained for diagnostics. Report totals sum displayed values. */
  raw: {
    pf: number;
    esi: number;
    otherDeduction: number;
    otherCash: number;
    netPayment: number;
  };
}

/** PF is calculated on min(resultant1, this cap). */
const PF_SALARY_CAP = 15_000;
const INCENTIVE_WORKING_DAYS_BASE = 26;

/**
 * Monthly incentive is prorated against fixed 26 working days and
 * multiplied by payable/present days.
 */
export function getEarnedIncentive(
  monthlyIncentive: number,
  paidDays: number,
): number {
  if (monthlyIncentive <= 0 || paidDays <= 0) return 0;
  return (monthlyIncentive / INCENTIVE_WORKING_DAYS_BASE) * paidDays;
}

/**
 * Payment flow:
 * 1. Resultant1 = (Basic + DA) * totalWorkingDays
 * 2. Resultant2 = Resultant1 + otherCash + allowances + overtime
 * 3. PF = 12% of pfBase, rounded to whole rupees. pfBase depends on
 *    newPfApplicable:
 *    - true  → min(Resultant1, 15,000)  (capped)
 *    - false → Resultant1               (full amount)
 * 4. ESI = 0.75% of Resultant2, rounded to whole rupees.
 * 5. Other cash, allowances, overtime and other deductions retain two decimals.
 * 6. Net = round(Resultant2 − roundedPF − roundedESI − two-decimal deductions).
 * Report totals sum these returned amounts; raw values are diagnostic only.
 */
export function computePayment(
  totalWorkingDays: number,
  basic: number,
  da: number,
  otherCash: number,
  allowances: number,
  overtime: number,
  otherDeduction: number,
  newPfApplicable = false,
): PaymentBreakdown {
  const resultant1 = roundHalfUp2((basic + da) * totalWorkingDays);
  const resultant2 = roundHalfUp2(resultant1 + roundHalfUp2(otherCash) + roundHalfUp2(allowances) + roundHalfUp2(overtime));
  const pfBase = newPfApplicable
    ? Math.min(resultant1, PF_SALARY_CAP)
    : resultant1;
  const pfRaw = pfBase * 0.12;
  const esiRaw = resultant2 * 0.0075;

  const pfRounded = roundNearestInteger(pfRaw);
  const esiRounded = roundNearestInteger(esiRaw);
  const otherDeductionRounded = roundHalfUp2(otherDeduction);
  const otherCashRounded = roundHalfUp2(otherCash);

  const netPaymentRaw = resultant2 - pfRaw - esiRaw - otherDeduction;
  const netPaymentRounded = roundNearestInteger(
    resultant2 - pfRounded - esiRounded - otherDeductionRounded,
  );

  return {
    totalWorkingDays,
    resultant1,
    resultant2,
    pf: pfRounded,
    esi: esiRounded,
    otherDeduction: otherDeductionRounded,
    netPayment: netPaymentRounded,
    basic: roundHalfUp2(basic),
    da: roundHalfUp2(da),
    otherCash: otherCashRounded,
    allowances: roundHalfUp2(allowances),
    overtime: roundHalfUp2(overtime),
    raw: {
      pf: pfRaw,
      esi: esiRaw,
      otherDeduction,
      otherCash,
      netPayment: netPaymentRaw,
    },
  };
}
