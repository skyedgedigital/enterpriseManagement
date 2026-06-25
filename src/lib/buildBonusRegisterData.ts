import { parse, isValid } from "date-fns";
import type { BonusChecklistData } from "@/lib/buildBonusChecklistData";
import type { Designation, Employee } from "@/types";
import { ceilToWholeRupee, roundHalfUp2 } from "@/lib/moneyRounding";

/**
 * Form C bonus register rows. Built from bonus checklist FY aggregates only —
 * does not modify checklist modules.
 */
export interface BonusRegisterRow {
  slNo: number;
  employeeId: string;
  employeeName: string;
  fathersName: string;
  completed15YearsAtFyStart: string;
  designation: string;
  daysWorkedYear: number;
  totalSalaryOrWages: number;
  amountOfBonusPayable: number;
  deductionPujaOrCustomary: number;
  deductionInterimBonus: number;
  deductionFinancialLoss: number;
  totalSumDeducted: number;
  netPayableAmount: number;
}

export interface BonusRegisterData {
  fyEndYear: number;
  fyLabel: string;
  periodFromDisplay: string;
  periodToDisplay: string;
  contractorName: string;
  contractorOfficeLine: string;
  contractorCorrespondingLine: string;
  orderNumber: string;
  bonusPercentage: number;
  rows: BonusRegisterRow[];
}

export interface BonusRegisterFooterTotals {
  sumDaysWorkedYear: number;
  sumTotalSalaryOrWages: number;
  sumBonusPayable: number;
  sumDeductionPujaOrCustomary: number;
  sumDeductionInterimBonus: number;
  sumDeductionFinancialLoss: number;
  sumTotalDeducted: number;
  sumNetPayable: number;
}

function parseEmployeeDob(raw: string | undefined): Date | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const formats = ["yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yyyy", "d/M/yyyy"] as const;
  for (const fmt of formats) {
    const d = parse(t, fmt, new Date());
    if (isValid(d)) return d;
  }
  return null;
}

function ageOnDate(dob: Date, ref: Date): number {
  let age = ref.getFullYear() - dob.getFullYear();
  const md = ref.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && ref.getDate() < dob.getDate())) age -= 1;
  return age;
}

function completed15YearsLabel(dob: Date | null, fyStartYear: number): string {
  if (!dob) return "—";
  const ref = new Date(fyStartYear, 3, 1);
  return ageOnDate(dob, ref) >= 15 ? "Yes" : "No";
}

function designationLabel(emp: Employee | undefined, designations: Designation[]): string {
  if (!emp?.designation) return "—";
  const d = designations.find((x) => x.id === emp.designation);
  return (d?.designation ?? "—").trim() || "—";
}

export function computeBonusRegisterFooterTotals(rows: BonusRegisterRow[]): BonusRegisterFooterTotals {
  let sumDaysWorkedYear = 0;
  let sumTotalSalaryOrWages = 0;
  let sumBonusPayable = 0;
  let sumDeductionPujaOrCustomary = 0;
  let sumDeductionInterimBonus = 0;
  let sumDeductionFinancialLoss = 0;
  let sumTotalDeducted = 0;
  let sumNetPayable = 0;
  for (const r of rows) {
    sumDaysWorkedYear += r.daysWorkedYear;
    sumTotalSalaryOrWages += r.totalSalaryOrWages;
    sumBonusPayable += r.amountOfBonusPayable;
    sumDeductionPujaOrCustomary += r.deductionPujaOrCustomary;
    sumDeductionInterimBonus += r.deductionInterimBonus;
    sumDeductionFinancialLoss += r.deductionFinancialLoss;
    sumTotalDeducted += r.totalSumDeducted;
    sumNetPayable += r.netPayableAmount;
  }
  return {
    sumDaysWorkedYear,
    sumTotalSalaryOrWages: roundHalfUp2(sumTotalSalaryOrWages),
    sumBonusPayable: roundHalfUp2(sumBonusPayable),
    sumDeductionPujaOrCustomary: roundHalfUp2(sumDeductionPujaOrCustomary),
    sumDeductionInterimBonus: roundHalfUp2(sumDeductionInterimBonus),
    sumDeductionFinancialLoss: roundHalfUp2(sumDeductionFinancialLoss),
    sumTotalDeducted: roundHalfUp2(sumTotalDeducted),
    sumNetPayable: roundHalfUp2(sumNetPayable),
  };
}

export interface BuildBonusRegisterParams {
  checklist: BonusChecklistData;
  employees: Employee[];
  designations: Designation[];
  bonusPercentage: number;
}

/**
 * Minimum days worked in the financial year for bonus eligibility. Follows the
 * Payment of Bonus Act, 1965 §8: an employee is entitled to be paid bonus only
 * if they have worked for not less than 30 working days in the accounting year.
 * Below this threshold the payable bonus (and therefore net payable) is zero.
 */
export const BONUS_MIN_DAYS_WORKED = 30;

export function buildBonusRegisterData({
  checklist,
  employees,
  designations,
  bonusPercentage,
}: BuildBonusRegisterParams): BonusRegisterData {
  const fyStartYear = checklist.fyEndYear - 1;
  const pct = bonusPercentage;
  const rows: BonusRegisterRow[] = [];

  let sl = 0;
  for (const cr of checklist.rows) {
    sl += 1;
    const emp = employees.find((e) => e.id === cr.employeeId);
    const dob = parseEmployeeDob(emp?.dob);
    const total = cr.total;
    // Statutory eligibility gate: under 30 days worked in the FY ⇒ no bonus.
    const eligible = cr.daysWorkedYear >= BONUS_MIN_DAYS_WORKED;
    const bonusRaw = eligible ? (total * pct) / 100 : 0;
    const bonus = eligible ? ceilToWholeRupee(bonusRaw) : 0;
    const puja = 0;
    const interim = 0;
    const loss = 0;
    const totalDed = 0;
    const net = eligible ? Math.max(0, ceilToWholeRupee(bonus - totalDed)) : 0;

    rows.push({
      slNo: sl,
      employeeId: cr.employeeId,
      employeeName: cr.employeeName,
      fathersName: (emp?.fathersName ?? "—").trim() || "—",
      completed15YearsAtFyStart: completed15YearsLabel(dob, fyStartYear),
      designation: designationLabel(emp, designations),
      daysWorkedYear: cr.daysWorkedYear,
      totalSalaryOrWages: roundHalfUp2(total),
      amountOfBonusPayable: bonus,
      deductionPujaOrCustomary: puja,
      deductionInterimBonus: interim,
      deductionFinancialLoss: loss,
      totalSumDeducted: totalDed,
      netPayableAmount: net,
    });
  }

  return {
    fyEndYear: checklist.fyEndYear,
    fyLabel: checklist.fyLabel,
    periodFromDisplay: checklist.periodFromDisplay,
    periodToDisplay: checklist.periodToDisplay,
    contractorName: checklist.contractorName,
    contractorOfficeLine: checklist.contractorOfficeLine,
    contractorCorrespondingLine: checklist.contractorCorrespondingLine,
    orderNumber: checklist.orderNumber,
    bonusPercentage: pct,
    rows,
  };
}

export function parseBonusPercentageInput(raw: string): number | null {
  const s = raw.trim().replace(/,/g, "");
  if (s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
