import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  computePayment,
  getEarnedIncentive,
  getWeeklyAllowanceSummaryFromAttendance,
} from "@/lib/paymentCalculation";
import {
  getAttendanceSliceForWorkOrder,
  getDayWorkOrderTag,
} from "@/lib/attendanceSlice";
import type { Attendance, Employee, Wages } from "@/types";
import { formatMoney2, roundNearestInteger } from "@/lib/moneyRounding";

export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  attendanceRecord: Attendance | null;
  /**
   * Single wages row to use when a specific work order is active. When
   * `workOrderId` is null this prop is ignored in favour of `wagesList` so the
   * modal can aggregate across every work order the employee worked on.
   */
  wagesRecord: Wages | null;
  /**
   * All wage rows for this (employee, year, month) regardless of work order.
   * Used for the combined view when no work-order filter is applied.
   */
  wagesList?: Wages[];
  workOrderId?: string | null;
  newPfApplicable?: boolean;
}

interface AggregatedBreakdown {
  totalWorkingDays: number;
  /** Flat-rate basic per day (same across WOs because it's employee designation driven). */
  basicRate: number;
  daRate: number;
  overtime: number;
  otherCash: number;
  allowances: number;
  resultant2: number;
  pf: number;
  esi: number;
  otherDeduction: number;
  netPayment: number;
}

export function PaymentModal({
  open,
  onOpenChange,
  employee,
  attendanceRecord,
  wagesRecord,
  wagesList,
  workOrderId,
  newPfApplicable = false,
}: PaymentModalProps) {
  const designations = useAppSelector((s) => s.designations.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);

  const designation = employee?.designation
    ? designations.find((d) => d.id === employee.designation) ?? null
    : null;

  /**
   * Combined or single-WO payment breakdown.
   *
   * - When `workOrderId` is set → compute exactly one per-WO breakdown (unchanged
   *   single-work-order behaviour).
   * - When `workOrderId` is null → discover every WO the employee touched this
   *   month (union of wage-row WOs and attendance day-tag WOs), compute a
   *   per-WO breakdown for each, and sum the monetary columns. Days and
   *   amounts are summed; rates are shown from the employee designation.
   *
   * When a WO has no wage row yet (seeded-default or missing), we still
   * compute its breakdown using attendance days × designation rates so the
   * admin sees the expected payment even before opening the Wages sheet.
   */
  const breakdown = useMemo<AggregatedBreakdown | null>(() => {
    if (!employee) return null;
    if (!attendanceRecord?.days || attendanceRecord.days.length === 0) {
      return null;
    }

    const designationBasic = designation ? Number(designation.basic) || 0 : 0;
    const designationDa = designation ? Number(designation.da) || 0 : 0;

    /** Compute a per-WO payment slice for the given work order id. */
    const computeForWo = (woId: string | null): AggregatedBreakdown => {
      const slice = getAttendanceSliceForWorkOrder(attendanceRecord, woId);
      const days = slice.presentDays;
      const wRow = woId
        ? (wagesList ?? []).find((w) => w.workOrderHr === woId) ?? null
        : wagesRecord;
      const wo = woId
        ? workOrders.find((x) => x.id === woId) ?? null
        : null;
      const basic = wRow?.basic ?? designationBasic;
      const da = wRow?.da ?? designationDa;
      const otherCash = wRow?.otherCash ?? 0;
      const weeklyAllowance =
        slice.days.length &&
        attendanceRecord.year != null &&
        attendanceRecord.month != null
          ? getWeeklyAllowanceSummaryFromAttendance(
              slice.days,
              attendanceRecord.year,
              attendanceRecord.month,
            ).weeklyAllowanceAmount
          : 0;
      const allowances = (wRow?.allowances ?? 0) + weeklyAllowance;
      const monthlyIncentive = wRow?.incentiveApplicable
        ? wRow.incentiveAmount ?? 0
        : 0;
      const overtime = getEarnedIncentive(monthlyIncentive, days);
      const otherDeduction = wRow?.otherDeduction ?? 0;
      // Per-WO new PF flag wins over the page-level prop so each WO is evaluated
      // with its own PF cap rule when aggregating.
      const pfApplicable = wo?.newPfApplicable ?? newPfApplicable;
      const bd = computePayment(
        days,
        basic,
        da,
        otherCash,
        allowances,
        overtime,
        otherDeduction,
        pfApplicable,
      );
      return {
        totalWorkingDays: bd.totalWorkingDays,
        basicRate: basic,
        daRate: da,
        overtime: bd.overtime,
        otherCash: bd.otherCash,
        allowances: bd.allowances,
        resultant2: bd.resultant2,
        pf: bd.pf,
        esi: bd.esi,
        otherDeduction: bd.otherDeduction,
        netPayment: bd.netPayment,
      };
    };

    if (workOrderId) {
      return computeForWo(workOrderId);
    }

    // Combined mode: union of WO ids from wage rows and per-day attendance tags.
    const woIds = new Set<string>();
    for (const w of wagesList ?? []) {
      if (w.workOrderHr) woIds.add(w.workOrderHr);
    }
    for (const d of attendanceRecord.days) {
      const tag = getDayWorkOrderTag(d, attendanceRecord);
      if (tag) woIds.add(tag);
    }

    // Legacy / untagged record: fall back to a single "all days" breakdown
    // using designation defaults so the user still sees *something* sensible.
    if (woIds.size === 0) {
      return computeForWo(null);
    }

    const ids = Array.from(woIds);
    const parts = ids.map((id) => computeForWo(id));

    const zero: AggregatedBreakdown = {
      totalWorkingDays: 0,
      basicRate: designationBasic,
      daRate: designationDa,
      overtime: 0,
      otherCash: 0,
      allowances: 0,
      resultant2: 0,
      pf: 0,
      esi: 0,
      otherDeduction: 0,
      netPayment: 0,
    };
    return parts.reduce<AggregatedBreakdown>(
      (acc, p) => ({
        totalWorkingDays: acc.totalWorkingDays + p.totalWorkingDays,
        // Rate columns are presentational only; keep the designation rate.
        basicRate: acc.basicRate,
        daRate: acc.daRate,
        overtime: acc.overtime + p.overtime,
        otherCash: acc.otherCash + p.otherCash,
        allowances: acc.allowances + p.allowances,
        resultant2: acc.resultant2 + p.resultant2,
        pf: acc.pf + p.pf,
        esi: acc.esi + p.esi,
        otherDeduction: acc.otherDeduction + p.otherDeduction,
        netPayment: acc.netPayment + p.netPayment,
      }),
      zero,
    );
  }, [
    employee,
    attendanceRecord,
    designation,
    wagesRecord,
    wagesList,
    workOrderId,
    workOrders,
    newPfApplicable,
  ]);

  if (!employee) return null;

  const message =
    !attendanceRecord?.days || attendanceRecord.days.length === 0
      ? "Fill attendance first to see payment details."
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/50 px-4 pr-12 py-3">
          <DialogTitle className="text-base font-semibold text-foreground">
            Payment
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 overflow-auto flex-1 min-h-0">
          {!breakdown ? (
            <p className="text-muted-foreground text-sm py-2">
              {message ?? "Fill attendance to see payment details."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="text-right">Days worked</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right whitespace-normal min-w-[7.5rem]">
                    Daily allowance (VDA)
                  </TableHead>
                  <TableHead className="text-right">Incentive</TableHead>
                  <TableHead className="text-right">Other Cash</TableHead>
                  <TableHead className="text-right">Allowances</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">PF (12%)</TableHead>
                  <TableHead className="text-right">ESI (0.75%)</TableHead>
                  <TableHead className="text-right">Other Ded.</TableHead>
                  <TableHead className="text-right font-medium">Net Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{employee.name || employee.code}</TableCell>
                  <TableCell className="text-right">{breakdown.totalWorkingDays}</TableCell>
                  <TableCell className="text-right">{formatMoney2(breakdown.basicRate)}</TableCell>
                  <TableCell className="text-right">{formatMoney2(breakdown.daRate)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.overtime)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.otherCash)}</TableCell>
                  <TableCell className="text-right">{formatMoney2(breakdown.allowances)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.resultant2)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.pf)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.esi)}</TableCell>
                  <TableCell className="text-right">{roundNearestInteger(breakdown.otherDeduction)}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{roundNearestInteger(breakdown.netPayment).toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
