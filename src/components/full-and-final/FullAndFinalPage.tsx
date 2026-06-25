import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchFinalSettlements } from "@/store/slices/finalSettlementSlice";
import { wagesService } from "@/services/wages.service";
import { attendanceService } from "@/services/attendance.service";
import {
  buildFullAndFinalData,
  type DeductionLine,
  type ModeOfSeparation,
} from "@/lib/buildFullAndFinalData";
import { FullAndFinalPDF } from "@/components/pdf/FullAndFinalPDF";
import { generateFullAndFinalExcel } from "@/lib/excel/generateFullAndFinalExcel";
import { openPDFInNewTab } from "@/lib/pdfUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODE_OPTIONS: ModeOfSeparation[] = [
  "Resignation by Workman",
  "Termination",
  "Retirement",
];

const DEDUCTION_LABELS = [
  "JNTVTI Training Cost",
  "Notice Period Recovery",
  "Advance Amount",
  "Any other (PPEs/Damage, loss & recovery)",
  "Loan Amount",
] as const;

type DeductionKey = (typeof DEDUCTION_LABELS)[number];

interface DeductionState {
  checked: boolean;
  amount: string;
}

function formatDdMmYyyy(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function FullAndFinalPage() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.employees.items);
  const designations = useAppSelector((s) => s.designations.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const finalSettlements = useAppSelector((s) => s.finalSettlements.items);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [previousYearLeave, setPreviousYearLeave] = useState<"Yes" | "No">("No");
  const [previousYearBonus, setPreviousYearBonus] = useState<"Yes" | "No">("No");
  const [balanceAttendance, setBalanceAttendance] = useState<"Yes" | "No">("No");
  const [modeOfSeparation, setModeOfSeparation] =
    useState<ModeOfSeparation | "">("");
  const [retrenchmentBenefit, setRetrenchmentBenefit] = useState(false);
  const [includeEl, setIncludeEl] = useState(true);
  const [includeCl, setIncludeCl] = useState(true);
  const [includeFl, setIncludeFl] = useState(true);

  const [deductionsNone, setDeductionsNone] = useState(false);
  const [deductions, setDeductions] = useState<Record<DeductionKey, DeductionState>>(
    () =>
      DEDUCTION_LABELS.reduce((acc, label) => {
        acc[label] = { checked: false, amount: "" };
        return acc;
      }, {} as Record<DeductionKey, DeductionState>),
  );

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
    dispatch(fetchWorkOrders());
    dispatch(fetchFinalSettlements());
  }, [dispatch]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId],
  );

  const selectedDesignation = useMemo(
    () =>
      selectedEmployee?.designation
        ? designations.find((d) => d.id === selectedEmployee.designation)
        : undefined,
    [designations, selectedEmployee],
  );

  const basicRate = Number(selectedDesignation?.basic) || 0;
  const daRate = Number(selectedDesignation?.da) || 0;
  const totalRate = basicRate + daRate;

  const toggleDeduction = (label: DeductionKey, checked: boolean) => {
    setDeductions((prev) => ({
      ...prev,
      [label]: { ...prev[label], checked },
    }));
    if (checked && deductionsNone) setDeductionsNone(false);
  };

  const setDeductionAmount = (label: DeductionKey, amount: string) => {
    setDeductions((prev) => ({
      ...prev,
      [label]: { ...prev[label], amount },
    }));
  };

  const toggleDeductionsNone = (checked: boolean) => {
    setDeductionsNone(checked);
    if (checked) {
      setDeductions(
        DEDUCTION_LABELS.reduce((acc, label) => {
          acc[label] = { checked: false, amount: "" };
          return acc;
        }, {} as Record<DeductionKey, DeductionState>),
      );
    }
  };

  const deductionLines = useMemo<DeductionLine[]>(() => {
    if (deductionsNone) return [];
    return DEDUCTION_LABELS.filter((label) => deductions[label].checked)
      .map((label) => ({
        label,
        amount: Number(deductions[label].amount) || 0,
      }))
      .filter((d) => d.amount > 0);
  }, [deductions, deductionsNone]);

  const loadFullAndFinalData = useCallback(
    async (reverse = false) => {
      if (!selectedEmployee) {
        toast.warning("Please select an employee first.");
        return null;
      }
      if (!fromDate || !toDate) {
        toast.warning("Please select the Service Period (From and To dates).");
        return null;
      }
      if (fromDate > toDate) {
        toast.error("Service Period — From date must be on or before To date.");
        return null;
      }
      if (!modeOfSeparation) {
        toast.warning("Please select the Mode of Separation.");
        return null;
      }

      const [wages, attendances] = await Promise.all([
        wagesService.getByFilter({ employeeId: selectedEmployee.id }),
        attendanceService.getByFilter({ employeeId: selectedEmployee.id }),
      ]);

      if (wages.length === 0) {
        toast.warning("No wages data found for this employee.");
        return null;
      }

      return buildFullAndFinalData({
        employee: selectedEmployee,
        wages,
        attendances,
        workOrders,
        designations,
        finalSettlements,
        retrenchmentBenefit,
        includeEl,
        includeCl,
        includeFl,
        reverse,
        fromDate,
        toDate,
        previousYearLeaveCleared: previousYearLeave === "Yes",
        previousYearBonusCleared: previousYearBonus === "Yes",
        makeBalanceAttendanceEntry: balanceAttendance === "Yes",
        modeOfSeparation: modeOfSeparation as ModeOfSeparation,
        deductions: deductionLines,
      });
    },
    [
      selectedEmployee,
      fromDate,
      toDate,
      workOrders,
      designations,
      finalSettlements,
      retrenchmentBenefit,
      includeEl,
      includeCl,
      includeFl,
      previousYearLeave,
      previousYearBonus,
      balanceAttendance,
      modeOfSeparation,
      deductionLines,
    ],
  );

  const runAction = useCallback(
    async (
      fn: () => Promise<void>,
      successMsg: string,
      failureMsg: string,
    ) => {
      setBusy(true);
      try {
        await fn();
        toast.success(successMsg);
      } catch (err) {
        console.error(err);
        toast.error(failureMsg);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const handleGenerateFinalSettlementPdf = () =>
    runAction(
      async () => {
        const data = await loadFullAndFinalData();
        if (!data) return;
        await openPDFInNewTab(createElement(FullAndFinalPDF, { data }));
      },
      "Full & Final Settlement PDF generated.",
      "Failed to generate Full & Final Settlement PDF.",
    );

  const handleGenerateFinalSettlementExcel = () =>
    runAction(
      async () => {
        const data = await loadFullAndFinalData();
        if (!data) return;
        await generateFullAndFinalExcel(data);
      },
      "Full & Final Settlement Excel generated.",
      "Failed to generate Full & Final Settlement Excel.",
    );

  const handleGenerateReverseFinalSettlementPdf = () =>
    runAction(
      async () => {
        const data = await loadFullAndFinalData(true);
        if (!data) return;
        await openPDFInNewTab(createElement(FullAndFinalPDF, { data }));
      },
      "Reverse Final Settlement PDF generated.",
      "Failed to generate Reverse Final Settlement PDF.",
    );

  const handleGenerateReverseFinalSettlementExcel = () =>
    runAction(
      async () => {
        const data = await loadFullAndFinalData(true);
        if (!data) return;
        await generateFullAndFinalExcel(data, "ReverseFinalSettlement");
      },
      "Reverse Final Settlement Excel generated.",
      "Failed to generate Reverse Final Settlement Excel.",
    );

  const servicePeriodDisplay =
    fromDate && toDate
      ? `${formatDdMmYyyy(fromDate)} - ${formatDdMmYyyy(toDate)}`
      : "";

  const rateDisplay =
    totalRate > 0
      ? `₹ ${totalRate.toFixed(2)} (${basicRate.toFixed(2)} + ${daRate.toFixed(2)})`
      : "";

  return (
    <div className="space-y-6 w-full">
      <div className="border-b border-border pb-2">
        <h1 className="text-2xl font-bold text-primary text-center">
          Full &amp; Final
        </h1>
      </div>

      <Card className="shadow-sm border-border max-w-5xl mx-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-left text-lg font-semibold text-foreground">
            Workman Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Select Employee</Label>
              <Select
                value={selectedEmployeeId || ""}
                onValueChange={setSelectedEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name ?? emp.code ?? emp.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Workman Name</Label>
              <Input
                disabled
                value={selectedEmployee?.name ?? ""}
                placeholder="Auto-filled"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Period</Label>
              <Input
                disabled
                value={servicePeriodDisplay}
                placeholder="Select From / To below"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Joining Vendor (dd/MM/yyyy)</Label>
              <Input
                disabled
                value={selectedEmployee?.appointmentDate ?? ""}
                placeholder="Auto-filled"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Rate of Pay (Basic+VDA)</Label>
              <Input
                disabled
                value={rateDisplay}
                placeholder="Auto-filled"
              />
            </div>
            <div className="space-y-2">
              <Label>Workman Designation</Label>
              <Input
                disabled
                value={selectedDesignation?.designation ?? ""}
                placeholder="Auto-filled"
              />
            </div>
            <div className="space-y-2">
              <Label>Previous Year Leave?</Label>
              <Select
                value={previousYearLeave}
                onValueChange={(v) => setPreviousYearLeave(v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Previous Year Bonus?</Label>
              <Select
                value={previousYearBonus}
                onValueChange={(v) => setPreviousYearBonus(v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Make Balance Attendance Entry?</Label>
              <Select
                value={balanceAttendance}
                onValueChange={(v) => setBalanceAttendance(v as "Yes" | "No")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode of Separation</Label>
              <Select
                value={modeOfSeparation}
                onValueChange={(v) =>
                  setModeOfSeparation(v as ModeOfSeparation)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Deductions (If any)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEDUCTION_LABELS.map((label) => {
                const state = deductions[label];
                return (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`ded-${label}`}
                        checked={state.checked}
                        disabled={deductionsNone}
                        onCheckedChange={(c) =>
                          toggleDeduction(label, c === true)
                        }
                      />
                      <Label
                        htmlFor={`ded-${label}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {label}
                      </Label>
                    </div>
                    {state.checked && (
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={state.amount}
                        onChange={(e) =>
                          setDeductionAmount(label, e.target.value)
                        }
                        placeholder="Amount"
                      />
                    )}
                  </div>
                );
              })}
              <div className="flex items-center gap-2 rounded-md border border-border p-3">
                <Checkbox
                  id="ded-none"
                  checked={deductionsNone}
                  onCheckedChange={(c) => toggleDeductionsNone(c === true)}
                />
                <Label
                  htmlFor="ded-none"
                  className="cursor-pointer text-sm font-normal"
                >
                  No
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Label htmlFor="retrenchment-benefit" className="whitespace-nowrap">
                Retrenchment benefit:
              </Label>
              <Switch
                id="retrenchment-benefit"
                checked={retrenchmentBenefit}
                onCheckedChange={setRetrenchmentBenefit}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Label className="whitespace-nowrap">Leave Components:</Label>
              <Button
                type="button"
                size="sm"
                variant={includeEl ? "default" : "outline"}
                onClick={() => setIncludeEl((v) => !v)}
              >
                EL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={includeCl ? "default" : "outline"}
                onClick={() => setIncludeCl((v) => !v)}
              >
                CL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={includeFl ? "default" : "outline"}
                onClick={() => setIncludeFl((v) => !v)}
              >
                FL
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              onClick={() => void handleGenerateFinalSettlementPdf()}
              disabled={busy}
              className="min-w-[220px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Working…" : "Generate FINAL SETTLEMENT"}
            </Button>
            <Button
              onClick={() => void handleGenerateFinalSettlementExcel()}
              disabled={busy}
              variant="secondary"
              className="min-w-[220px]"
            >
              {busy ? "Working…" : "Final Settlement Excel"}
            </Button>
            <Button
              onClick={() => void handleGenerateReverseFinalSettlementPdf()}
              disabled={busy}
              className="min-w-[260px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {busy ? "Working…" : "Generate REVERSE FINAL SETTLEMENT"}
            </Button>
            <Button
              onClick={() => void handleGenerateReverseFinalSettlementExcel()}
              disabled={busy}
              variant="secondary"
              className="min-w-[260px]"
            >
              {busy ? "Working…" : "Reverse Final Settlement Excel"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FullAndFinalPage;
