import type {
  Attendance,
  Designation,
  Employee,
  FinalSettlement,
  Wages,
  WorkOrder,
} from "@/types";
import { CONTRACTOR_NAME } from "@/lib/constants";
import { buildWagesPaySlipData } from "@/lib/generateWagesPaySlip";
import { roundHalfUp2, roundNearestInteger } from "@/lib/moneyRounding";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModeOfSeparation =
  | "Resignation by Workman"
  | "Termination"
  | "Retirement";

export interface DeductionLine {
  label: string;
  amount: number;
}

export interface FullAndFinalMonthData {
  month: number;
  label: string;
  daysWorked: number;
  gross: number;
}

export interface FullAndFinalYearData {
  year: number;
  label: string; // e.g. "2026-27"
  months: FullAndFinalMonthData[];
  totalDays: number;
  totalGross: number;
  el: number;
  cl: number;
  fl: number;
}

export interface FullAndFinalData {
  employeeName: string;
  contractorName: string;
  vendorCode: string;
  dateOfEmployment: string;
  years: FullAndFinalYearData[];

  // Service Period
  servicePeriodFrom: string; // dd/mm/yyyy
  servicePeriodTo: string;

  // Workman details
  workmanDesignation: string;
  ratePayBasic: number;
  ratePayDa: number;
  ratePayTotal: number;

  // Flags
  previousYearLeaveCleared: boolean;
  previousYearBonusCleared: boolean;
  makeBalanceAttendanceEntry: boolean;
  modeOfSeparation: ModeOfSeparation | "";

  grandTotalDays: number;
  grandTotalGross: number;

  // Unpaid wages (current separation month, partial)
  unpaidWages: number;
  unpaidWagesDays: number;

  // Current-FY bonus
  bonusPercentage: number;
  bonusAmount: number;
  currentFYDaysWorked: number;
  currentFYGross: number;

  // Previous-FY bonus
  previousFYBonusAmount: number;
  previousFYDaysWorked: number;
  previousFYGross: number;

  elTotal: number;
  clTotal: number;
  flTotal: number;
  totalLeaveDaysForPayment: number;
  leaveAvailedDays: number;
  balanceLeaveDays: number;
  dailyPayRate: number;
  leaveAmountMonetary: number;

  gratuityPercentage: number;
  gratuityAmount: number;
  gratuityYears: number;

  retrenchmentPercentage: number;
  retrenchmentAmount: number;
  completedYearsOfService: number;

  noticePay: number;

  totalFullAndFinal: number;

  // Deductions & net
  deductionLines: DeductionLine[];
  totalDeductions: number;
  netPayable: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const BONUS_PERCENTAGE = 8.33;
const RETRENCHMENT_PERCENTAGE = 4.81;
const DAYS_PER_EL = 20;
const DAYS_PER_CL = 35;
const DAYS_PER_FL = 60;
const TERMINATION_NOTICE_DAYS = 26;
const TERMINATION_MIN_WORKING_DAYS = 240;
const TERMINATION_SHORT_NOTICE_DAYS = 3;

function pickWage(
  wages: Wages[],
  employeeId: string,
  year: number,
  month: number,
): Wages | null {
  const matches = wages.filter(
    (w) => w.employee === employeeId && w.year === year && w.month === month,
  );
  if (matches.length === 0) return null;
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

function pickAttendance(
  attendances: Attendance[],
  employeeId: string,
  year: number,
  month: number,
  wageWorkOrderHr?: string,
): Attendance | null {
  const matches = attendances.filter(
    (a) => a.employee === employeeId && a.year === year && a.month === month,
  );
  if (matches.length === 0) return null;
  if (wageWorkOrderHr) {
    const exact = matches.find((a) => a.workOrderHr === wageWorkOrderHr);
    if (exact) return exact;
  }
  return matches.slice().sort((a, b) => a.id.localeCompare(b.id))[0];
}

function getDailyPayRate(
  employee: Employee,
  designations: Designation[],
): { basic: number; da: number; total: number } {
  const basic = Number(employee.basic) || 0;
  const da = Number(employee.da) || 0;
  if (basic + da > 0) return { basic, da, total: basic + da };

  if (employee.designation) {
    const desig = designations.find((d) => d.id === employee.designation);
    if (desig) {
      const b = Number(desig.basic) || 0;
      const d = Number(desig.da) || 0;
      return { basic: b, da: d, total: b + d };
    }
  }
  return { basic: 0, da: 0, total: 0 };
}

function getDesignationName(
  employee: Employee,
  designations: Designation[],
): string {
  if (!employee.designation) return "—";
  const d = designations.find((x) => x.id === employee.designation);
  return d?.designation ?? "—";
}

/** Parse ISO yyyy-MM-dd into { year, month (1-12), day }. Returns null for invalid. */
function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m, day: d };
}

function formatDdMmYyyy(iso: string): string {
  const p = parseISO(iso);
  if (!p) return iso;
  return `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")}/${p.year}`;
}

/** Indian Financial Year of a given calendar (year, month). FY 2025-26 starts Apr 2025. */
function financialYearOf(year: number, month: number): number {
  return month >= 4 ? year : year - 1;
}

/** Label e.g. "2026-27" from calendar year */
function calendarYearLabel(year: number): string {
  const next = (year + 1) % 100;
  return `${year}-${String(next).padStart(2, "0")}`;
}

/** true if (year, month) is within [fromYear/fromMonth, toYear/toMonth] inclusive. */
function monthInRange(
  year: number,
  month: number,
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): boolean {
  const v = year * 12 + month;
  const lo = fromYear * 12 + fromMonth;
  const hi = toYear * 12 + toMonth;
  return v >= lo && v <= hi;
}

/** Calculate full completed years between two ISO dates (appointment → separation). */
function completedYears(fromIso: string, toIso: string): number {
  const a = parseISO(fromIso);
  const b = parseISO(toIso);
  if (!a || !b) return 0;
  let years = b.year - a.year;
  if (b.month < a.month || (b.month === a.month && b.day < a.day)) years -= 1;
  return Math.max(0, years);
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface BuildFullAndFinalParams {
  employee: Employee;
  wages: Wages[];
  attendances: Attendance[];
  workOrders: WorkOrder[];
  designations: Designation[];
  finalSettlements: FinalSettlement[];
  retrenchmentBenefit: boolean;
  includeEl?: boolean;
  includeCl?: boolean;
  includeFl?: boolean;
  reverse?: boolean;

  // New required inputs (service period + flags)
  fromDate: string; // yyyy-MM-dd
  toDate: string; // yyyy-MM-dd
  previousYearLeaveCleared: boolean;
  previousYearBonusCleared: boolean;
  makeBalanceAttendanceEntry: boolean;
  modeOfSeparation: ModeOfSeparation;
  deductions: DeductionLine[];
}

export function buildFullAndFinalData({
  employee,
  wages,
  attendances,
  workOrders,
  designations,
  finalSettlements,
  retrenchmentBenefit,
  includeEl = true,
  includeCl = true,
  includeFl = true,
  reverse = false,
  fromDate,
  toDate,
  previousYearLeaveCleared,
  previousYearBonusCleared,
  makeBalanceAttendanceEntry,
  modeOfSeparation,
  deductions,
}: BuildFullAndFinalParams): FullAndFinalData {
  const employeeId = employee.id;

  const fromP = parseISO(fromDate);
  const toP = parseISO(toDate);
  const fromY = fromP?.year ?? 0;
  const fromM = fromP?.month ?? 1;
  const toY = toP?.year ?? 0;
  const toM = toP?.month ?? 12;

  // Determine calendar years covered by Service Period
  const yearSet = new Set<number>();
  if (fromP && toP) {
    for (let y = fromY; y <= toY; y++) yearSet.add(y);
  }

  // Fallback — if no service period given, fall back to distinct years from wages
  if (yearSet.size === 0) {
    const empWages = wages.filter((w) => w.employee === employeeId);
    empWages.forEach((w) => yearSet.add(w.year));
  }

  const sortedYears = [...yearSet].sort((a, b) => a - b);
  if (reverse) sortedYears.reverse();

  // Rate details from designation master
  const rate = getDailyPayRate(employee, designations);
  const designationName = getDesignationName(employee, designations);

  // Build per-year monthly data — only months inside Service Period contribute
  const years: FullAndFinalYearData[] = [];
  let grandTotalDays = 0;
  let grandTotalGross = 0;

  const currentFY = fromP && toP ? financialYearOf(toY, toM) : 0;
  const previousFY = currentFY - 1;

  let currentFYDaysWorked = 0;
  let currentFYGross = 0;
  let previousFYDaysWorked = 0;
  let previousFYGross = 0;

  // Unpaid wages = days worked in the last month of service period × daily rate
  let unpaidWagesDays = 0;

  for (const year of sortedYears) {
    const months: FullAndFinalMonthData[] = [];
    let yearDays = 0;
    let yearGross = 0;

    for (let m = 1; m <= 12; m++) {
      // Only compute if this (year, month) is inside Service Period
      const inRange =
        fromP && toP
          ? monthInRange(year, m, fromY, fromM, toY, toM)
          : true;

      if (!inRange) {
        months.push({ month: m, label: MONTH_LABELS[m - 1], daysWorked: 0, gross: 0 });
        continue;
      }

      const wageRow = pickWage(wages, employeeId, year, m);
      if (!wageRow) {
        months.push({ month: m, label: MONTH_LABELS[m - 1], daysWorked: 0, gross: 0 });
        continue;
      }

      const woId = wageRow.workOrderHr ?? "";
      const workOrder = woId
        ? workOrders.find((wo) => wo.id === woId) ?? null
        : null;

      const attendance = pickAttendance(
        attendances,
        employeeId,
        year,
        m,
        wageRow.workOrderHr,
      );

      const slip = buildWagesPaySlipData({
        employee,
        wages: wageRow,
        attendance,
        workOrder,
        designations,
        month: m,
        year,
        newPfApplicable: workOrder?.newPfApplicable ?? false,
      });

      const daysWorked = slip.daysWorked;
      const gross = slip.grossWages;

      months.push({ month: m, label: MONTH_LABELS[m - 1], daysWorked, gross });
      yearDays += daysWorked;
      yearGross += gross;

      // FY aggregation
      const fy = financialYearOf(year, m);
      if (fy === currentFY) {
        currentFYDaysWorked += daysWorked;
        currentFYGross += gross;
      } else if (fy === previousFY) {
        previousFYDaysWorked += daysWorked;
        previousFYGross += gross;
      }

      // Unpaid wages — last month within service period (separation month)
      if (year === toY && m === toM) {
        unpaidWagesDays = daysWorked;
      }
    }

    const el = includeEl ? Math.round(yearDays / DAYS_PER_EL) : 0;
    const cl = includeCl ? Math.round(yearDays / DAYS_PER_CL) : 0;
    const fl = includeFl ? Math.round(yearDays / DAYS_PER_FL) : 0;

    years.push({
      year,
      label: calendarYearLabel(year),
      months,
      totalDays: roundHalfUp2(yearDays),
      totalGross: roundHalfUp2(yearGross),
      el,
      cl,
      fl,
    });

    grandTotalDays += yearDays;
    grandTotalGross += yearGross;
  }

  grandTotalDays = roundHalfUp2(grandTotalDays);
  grandTotalGross = roundHalfUp2(grandTotalGross);

  // Unpaid wages amount
  const unpaidWages = roundHalfUp2(unpaidWagesDays * rate.total);

  // Current-FY Bonus (8.33% of current FY gross) — eligibility: ≥ 30 days
  const bonusAmount =
    currentFYDaysWorked >= 30
      ? roundHalfUp2((currentFYGross * BONUS_PERCENTAGE) / 100)
      : 0;

  // Previous-FY Bonus — skipped entirely if user flagged previous-year bonus cleared
  const previousFYBonusAmount =
    !previousYearBonusCleared && previousFYDaysWorked >= 30
      ? roundHalfUp2((previousFYGross * BONUS_PERCENTAGE) / 100)
      : 0;

  // Leave entitlements. If previousYearLeaveCleared, only keep entitlements whose FY
  // end-year matches the current FY (i.e. drop any FY strictly before currentFY).
  let elTotal = 0;
  let clTotal = 0;
  let flTotal = 0;
  for (const y of years) {
    if (previousYearLeaveCleared) {
      // A calendar year whose end portion (Jan-Mar) lies in currentFY has FY ending year = y.year
      // Easiest heuristic: only include entitlements for calendar years that contribute to currentFY
      // Current FY is Apr(currentFY)-Mar(currentFY+1). The calendar years touching it: currentFY and currentFY+1.
      if (y.year !== currentFY && y.year !== currentFY + 1) continue;
    }
    elTotal += y.el;
    clTotal += y.cl;
    flTotal += y.fl;
  }
  const totalLeaveDaysForPayment = elTotal + clTotal + flTotal;

  // Leave availed from Final Settlements
  const empSettlement = finalSettlements.find((fs) => fs.employee === employeeId);
  const encashedYears = new Set(
    (empSettlement?.leave ?? []).filter((l) => l.status).map((l) => l.year),
  );

  let leaveAvailedDays = 0;
  for (const y of years) {
    if (encashedYears.has(y.year)) {
      leaveAvailedDays += y.el + y.cl + y.fl;
    }
  }

  const balanceLeaveDays = Math.max(0, totalLeaveDaysForPayment - leaveAvailedDays);
  const leaveAmountMonetary = roundHalfUp2(balanceLeaveDays * rate.total);

  // Completed years of service (used for Gratuity and Retrenchment display)
  const yearsServed =
    employee.appointmentDate && toDate
      ? completedYears(employee.appointmentDate, toDate)
      : 0;

  // Gratuity — eligible only if ≥ 5 continuous years of service
  const gratuityAmount =
    yearsServed >= 5
      ? roundHalfUp2(((rate.total * 15) / 26) * yearsServed)
      : 0;

  // Retrenchment
  const retrenchmentAmount = retrenchmentBenefit
    ? roundHalfUp2((grandTotalGross * RETRENCHMENT_PERCENTAGE) / 100)
    : 0;

  // Notice Pay — driven by Mode of Separation
  let noticePay = 0;
  if (modeOfSeparation === "Termination") {
    // nil if total working days ≥ 240 from DOJ, else 3 days of (Basic+DA);
    // otherwise 26 days × (Basic+DA)
    if (grandTotalDays >= TERMINATION_MIN_WORKING_DAYS) {
      noticePay = 0;
    } else if (grandTotalDays > 0) {
      noticePay = roundHalfUp2(TERMINATION_SHORT_NOTICE_DAYS * rate.total);
    } else {
      noticePay = roundHalfUp2(TERMINATION_NOTICE_DAYS * rate.total);
    }
  }
  // Resignation by Workman → 0, Retirement → 0

  // Total F&F (gross before deductions)
  const totalFullAndFinal = roundNearestInteger(
    unpaidWages +
      bonusAmount +
      previousFYBonusAmount +
      leaveAmountMonetary +
      gratuityAmount +
      retrenchmentAmount +
      noticePay,
  );

  // Deductions & net payable
  const cleanDeductions = deductions
    .filter((d) => d && d.amount > 0)
    .map((d) => ({ label: d.label, amount: roundHalfUp2(d.amount) }));
  const totalDeductions = roundHalfUp2(
    cleanDeductions.reduce((sum, d) => sum + d.amount, 0),
  );
  const netPayable = roundNearestInteger(totalFullAndFinal - totalDeductions);

  return {
    employeeName: (employee.name ?? employee.code ?? "").trim() || "—",
    contractorName: CONTRACTOR_NAME.replace(/,\s*$/, "").trim(),
    vendorCode: employee.workManNo?.trim() || "—",
    dateOfEmployment: employee.appointmentDate?.trim() || "—",
    years,

    servicePeriodFrom: formatDdMmYyyy(fromDate),
    servicePeriodTo: formatDdMmYyyy(toDate),

    workmanDesignation: designationName,
    ratePayBasic: rate.basic,
    ratePayDa: rate.da,
    ratePayTotal: rate.total,

    previousYearLeaveCleared,
    previousYearBonusCleared,
    makeBalanceAttendanceEntry,
    modeOfSeparation,

    grandTotalDays,
    grandTotalGross,

    unpaidWages,
    unpaidWagesDays,

    bonusPercentage: BONUS_PERCENTAGE,
    bonusAmount,
    currentFYDaysWorked,
    currentFYGross: roundHalfUp2(currentFYGross),

    previousFYBonusAmount,
    previousFYDaysWorked,
    previousFYGross: roundHalfUp2(previousFYGross),

    elTotal,
    clTotal,
    flTotal,
    totalLeaveDaysForPayment,
    leaveAvailedDays,
    balanceLeaveDays,
    dailyPayRate: rate.total,
    leaveAmountMonetary,

    gratuityPercentage: 4.81,
    gratuityAmount,
    gratuityYears: yearsServed,

    retrenchmentPercentage: RETRENCHMENT_PERCENTAGE,
    retrenchmentAmount,
    completedYearsOfService: yearsServed,

    noticePay,

    totalFullAndFinal,

    deductionLines: cleanDeductions,
    totalDeductions,
    netPayable,
  };
}
