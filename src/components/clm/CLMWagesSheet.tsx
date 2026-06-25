import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addWages, updateWages } from "@/store/slices/wagesSlice";
import {
  computePayment,
  getEarnedIncentive,
  getPaidDaysFromAttendance,
  getWeeklyAllowanceSummaryFromAttendance,
} from "@/lib/paymentCalculation";
import { getAttendanceSliceForWorkOrder } from "@/lib/attendanceSlice";
import { MONTHS, WAGES_ALLOWANCE_LABELS } from "@/lib/constants";
import { formatMoney2, formatMoneyWhole } from "@/lib/moneyRounding";
import type { Employee } from "@/types";
import type { Attendance } from "@/types";
import type { Wages } from "@/types";

const DEFAULT_WORKING_DAYS = 26;
const ALLOWANCE_KEYS = WAGES_ALLOWANCE_LABELS.map((_, i) => `allowance_${i}` as const);
type AllowanceKey = (typeof ALLOWANCE_KEYS)[number];

type WagesFormValues = {
  totalWorkingDays: number;
  attendance: number;
  basic: number;
  da: number;
  otherCash: number;
  fine: number;
  ppeDeduction: number;
  otherDeduction: number;
  advanceDeduction: number;
  damageDeduction: number;
  incentiveApplicable: boolean;
  incentiveDays: number;
  incentiveAmount: number;
  isAdvanceDeduction: boolean;
  isDamageDeduction: boolean;
} & Record<AllowanceKey, number>;

export interface CLMWagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  year: number;
  month: number;
  workOrderId: string | null;
  attendanceRecord: Attendance | null;
  existingWages: Wages | null;
  newPfApplicable?: boolean;
  onSaved?: () => void;
}

export function CLMWagesSheet({
  open,
  onOpenChange,
  employee,
  year,
  month,
  workOrderId,
  attendanceRecord,
  existingWages,
  newPfApplicable = false,
  onSaved,
}: CLMWagesSheetProps) {
  const dispatch = useAppDispatch();
  const designations = useAppSelector((s) => s.designations.items);
  const [saving, setSaving] = useState(false);

  // Wages are scoped to a single (employee, work order, month). Derive paid days from the
  // slice of the monthly attendance that belongs to this work order so we don't pick up
  // days worked on other work orders.
  const attendanceSlice = getAttendanceSliceForWorkOrder(
    attendanceRecord,
    workOrderId ?? null,
  );
  const paidDays = attendanceSlice.days.length
    ? getPaidDaysFromAttendance(attendanceSlice.days)
    : (attendanceRecord?.presentDays ?? 0);
  const designation = employee?.designation
    ? designations.find((d) => d.id === employee.designation)
    : null;

  const defaultAllowances = Object.fromEntries(
    ALLOWANCE_KEYS.map((k) => [k, 0])
  ) as Record<AllowanceKey, number>;

  const { register, handleSubmit, setValue, watch, reset } = useForm<WagesFormValues>({
    defaultValues: {
      totalWorkingDays: DEFAULT_WORKING_DAYS,
      attendance: 0,
      basic: 0,
      da: 0,
      ...defaultAllowances,
      otherCash: 0,
      fine: 0,
      ppeDeduction: 0,
      otherDeduction: 0,
      advanceDeduction: 0,
      damageDeduction: 0,
      incentiveApplicable: false,
      incentiveDays: 0,
      incentiveAmount: 0,
      isAdvanceDeduction: false,
      isDamageDeduction: false,
    },
  });

  const watched = watch();

  const allowancesSum = ALLOWANCE_KEYS.reduce(
    (sum, key) => sum + (Number(watched[key as AllowanceKey]) || 0),
    0
  );
  const weeklyAllowanceAmount =
    attendanceSlice.days.length &&
    attendanceRecord?.year != null &&
    attendanceRecord?.month != null
      ? getWeeklyAllowanceSummaryFromAttendance(
          attendanceSlice.days,
          attendanceRecord.year,
          attendanceRecord.month,
        ).weeklyAllowanceAmount
      : 0;

  useEffect(() => {
    if (!open || !employee) return;
    const basic = designation ? Number(designation.basic) || 0 : 0;
    const da = designation ? Number(designation.da) || 0 : 0;
    if (existingWages) {
      const existingAllow = existingWages.allowances ?? 0;
      const allowanceDefaults = Object.fromEntries(
        ALLOWANCE_KEYS.map((k, i) => [
          k,
          i === ALLOWANCE_KEYS.length - 1 ? existingAllow : 0,
        ])
      ) as Record<string, number>;
      reset({
        totalWorkingDays: existingWages.totalWorkingDays ?? DEFAULT_WORKING_DAYS,
        attendance: existingWages.attendance ?? paidDays,
        basic: existingWages.basic ?? basic,
        da: existingWages.da ?? da,
        ...allowanceDefaults,
        otherCash: existingWages.otherCash ?? 0,
        fine: 0,
        ppeDeduction: 0,
        otherDeduction: existingWages.otherDeduction ?? 0,
        advanceDeduction: existingWages.advanceDeduction ?? 0,
        damageDeduction: existingWages.damageDeduction ?? 0,
        incentiveApplicable: existingWages.incentiveApplicable ?? false,
        incentiveDays: existingWages.incentiveDays ?? 0,
        incentiveAmount: existingWages.incentiveAmount ?? 0,
        isAdvanceDeduction: existingWages.isAdvanceDeduction ?? false,
        isDamageDeduction: existingWages.isDamageDeduction ?? false,
      });
    } else {
      reset({
        totalWorkingDays: DEFAULT_WORKING_DAYS,
        attendance: Math.round(paidDays * 10) / 10,
        basic,
        da,
        ...defaultAllowances,
        otherCash: 0,
        fine: 0,
        ppeDeduction: 0,
        otherDeduction: 0,
        advanceDeduction: 0,
        damageDeduction: 0,
        incentiveApplicable: false,
        incentiveDays: 0,
        incentiveAmount: 0,
        isAdvanceDeduction: false,
        isDamageDeduction: false,
      });
    }
  }, [open, employee, designation, existingWages, paidDays, reset]);

  const attendanceForCalc = attendanceSlice.days.length
    ? attendanceSlice.presentDays
    : (Number(watched.attendance) || 0);
  const monthlyIncentive =
    watched.incentiveApplicable ? Number(watched.incentiveAmount) || 0 : 0;
  const incentiveEarned = getEarnedIncentive(monthlyIncentive, attendanceForCalc);
  const allowancesForPayment = allowancesSum + weeklyAllowanceAmount;
  const otherDeductionTotal =
    (Number(watched.fine) || 0) +
    (Number(watched.ppeDeduction) || 0) +
    (Number(watched.otherDeduction) || 0);
  const breakdownPreview = computePayment(
    attendanceForCalc,
    Number(watched.basic) || 0,
    Number(watched.da) || 0,
    Number(watched.otherCash) || 0,
    allowancesForPayment,
    incentiveEarned,
    otherDeductionTotal,
    newPfApplicable,
  );
  const totalEarnings = breakdownPreview.resultant2;
  const netAmount = breakdownPreview.netPayment;

  const onSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      if (!employee?.designation) {
        toast.error("Employee designation is required.");
        return;
      }
      setSaving(true);
      const attendanceDays = attendanceSlice.days.length
        ? attendanceSlice.presentDays
        : (Number(data.attendance) || 0);
      const monthlyIncentive = !!data.incentiveApplicable ? Number(data.incentiveAmount) || 0 : 0;
      const incentiveEarned = getEarnedIncentive(monthlyIncentive, attendanceDays);
      const otherDeductionTotal =
        (Number(data.fine) || 0) +
        (Number(data.ppeDeduction) || 0) +
        (Number(data.otherDeduction) || 0);
      const allowanceBase = ALLOWANCE_KEYS.reduce(
        (sum, key) => sum + (Number(data[key]) || 0),
        0,
      );
      const allowancesForPayment = allowanceBase + weeklyAllowanceAmount;
      const breakdown = computePayment(
        attendanceDays,
        Number(data.basic) || 0,
        Number(data.da) || 0,
        Number(data.otherCash) || 0,
        allowancesForPayment,
        incentiveEarned,
        otherDeductionTotal,
        newPfApplicable,
      );
      const payload = {
        employee: employee.id,
        designation: employee.designation,
        month,
        year,
        workOrderHr: workOrderId || undefined,
        totalWorkingDays: Number(data.totalWorkingDays) || DEFAULT_WORKING_DAYS,
        attendance: attendanceDays,
        basic: Number(data.basic) || 0,
        da: Number(data.da) || 0,
        payRate: (Number(data.basic) || 0) + (Number(data.da) || 0),
        allowances: allowanceBase,
        otherCash: Number(data.otherCash) || 0,
        total: breakdown.resultant2,
        incentiveApplicable: !!data.incentiveApplicable,
        incentiveDays: Number(data.incentiveDays) || 0,
        incentiveAmount: monthlyIncentive,
        otherDeduction: otherDeductionTotal,
        advanceDeduction: Number(data.advanceDeduction) || 0,
        damageDeduction: Number(data.damageDeduction) || 0,
        isAdvanceDeduction: !!data.isAdvanceDeduction,
        isDamageDeduction: !!data.isDamageDeduction,
        netAmountPaid: breakdown.netPayment,
      };
      if (existingWages) {
        const result = await dispatch(updateWages({ id: existingWages.id, data: payload }));
        if (updateWages.fulfilled.match(result)) {
          toast.success("Wages updated.");
          onSaved?.();
          onOpenChange(false);
        } else toast.error(String(result.payload));
      } else {
        const result = await dispatch(addWages(payload));
        if (addWages.fulfilled.match(result)) {
          toast.success("Wages saved.");
          onSaved?.();
          onOpenChange(false);
        } else toast.error(String(result.payload));
      }
      setSaving(false);
    },
    [
      employee,
      month,
      year,
      workOrderId,
      attendanceSlice,
      weeklyAllowanceAmount,
      newPfApplicable,
      existingWages,
      dispatch,
      onSaved,
      onOpenChange,
    ]
  );

  if (!employee) return null;

  const monthLabel = MONTHS.find((m) => m.value === month)?.label ?? String(month);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0 gap-0 flex flex-col"
      >
        <SheetHeader className="shrink-0 border-b border-border px-6 py-4 bg-card">
          <SheetTitle className="text-primary text-lg">Save/Update Wages</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        >
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Employee</Label>
                <Input readOnly value={employee.name || employee.code} className="bg-muted h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Designation</Label>
                <Input readOnly value={designation?.designation ?? "-"} className="bg-muted h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Year</Label>
                <Input readOnly value={year} className="bg-muted h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Month</Label>
                <Input readOnly value={monthLabel} className="bg-muted h-9" />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-primary mb-3">BASIC & VDA</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>BASIC</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("basic")} />
                </div>
                <div className="space-y-1.5">
                  <Label>VDA (Variable Dearness Allowance)</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("da")} />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Additions</h3>
              <div className="grid grid-cols-2 gap-3">
                {WAGES_ALLOWANCE_LABELS.map((label, i) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-sm">{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9"
                      {...register(ALLOWANCE_KEYS[i])}
                    />
                  </div>
                ))}
                <div className="space-y-1.5 col-span-2">
                  <Label>Other Cash</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("otherCash")} />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-primary mb-3">Deductions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fine</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("fine")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Advance Deduction</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("advanceDeduction")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Damage Deduction</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("damageDeduction")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deduction for PPE</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("ppeDeduction")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Other Deduction</Label>
                  <Input type="number" step="0.01" className="h-9" {...register("otherDeduction")} />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={watched.incentiveApplicable}
                  onCheckedChange={(v) => setValue("incentiveApplicable", v)}
                />
                <Label>Incentive Applicable</Label>
              </div>
              {watched.incentiveApplicable && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label>Incentive Days</Label>
                    <Input type="number" className="h-9" {...register("incentiveDays")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Incentive Amount</Label>
                    <Input type="number" step="0.01" className="h-9" {...register("incentiveAmount")} />
                  </div>
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Earned incentive = (Monthly incentive / 26) x Present days = ₹
                    {formatMoney2(incentiveEarned)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border px-6 py-4 bg-muted/30 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-semibold text-foreground">₹{formatMoney2(totalEarnings)}</span>
              {" — "}
              Net: <span className="font-semibold text-primary">₹{formatMoneyWhole(netAmount)}</span>
            </p>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white shrink-0"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Wage
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
