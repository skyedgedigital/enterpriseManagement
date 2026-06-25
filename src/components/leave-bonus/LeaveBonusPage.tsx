import { createElement, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import {
  fetchWagesForCalendarYear,
  fetchWagesForFinancialYear,
} from "@/store/slices/wagesSlice";
import {
  fetchAttendanceForFinancialYear,
  fetchAttendanceForCalendarYear,
} from "@/store/slices/attendanceSlice";
import { buildBonusChecklistData } from "@/lib/buildBonusChecklistData";
import { buildLeaveRegisterChecklistData } from "@/lib/buildLeaveRegisterChecklistData";
import { buildLeavePaymentRegisterData } from "@/lib/buildLeavePaymentRegisterData";
import {
  buildBonusRegisterData,
  parseBonusPercentageInput,
} from "@/lib/buildBonusRegisterData";
import { BonusChecklistPDF } from "@/components/pdf/BonusChecklistPDF";
import { BonusRegisterPDF } from "@/components/pdf/BonusRegisterPDF";
import { LeaveChecklistPDF } from "@/components/pdf/LeaveChecklistPDF";
import { LeavePaymentRegisterPDF } from "@/components/pdf/LeavePaymentRegisterPDF";
import { generateBonusChecklistExcel } from "@/lib/excel/generateBonusChecklistExcel";
import { generateBonusRegisterExcel } from "@/lib/excel/generateBonusRegisterExcel";
import { generateLeaveChecklistExcel } from "@/lib/excel/generateLeaveChecklistExcel";
import { generateLeavePaymentRegisterExcel } from "@/lib/excel/generateLeavePaymentRegisterExcel";
import { openPDFInNewTab } from "@/lib/pdfUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);
const DEFAULT_BONUS_PERCENTAGE = "8.33";

export function LeaveBonusPage() {
  const dispatch = useAppDispatch();
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const employees = useAppSelector((s) => s.employees.items);
  const designations = useAppSelector((s) => s.designations.items);

  const [bonusYear, setBonusYear] = useState(currentYear);
  const [bonusWorkOrderId, setBonusWorkOrderId] = useState<string>("");
  const [bonusPercentage, setBonusPercentage] = useState(DEFAULT_BONUS_PERCENTAGE);
  const [bonusBusy, setBonusBusy] = useState(false);

  const [leaveYear, setLeaveYear] = useState(currentYear);
  const [leaveWorkOrderId, setLeaveWorkOrderId] = useState<string>("");
  /** Shared busy state for checklist + register (same pattern as bonus card). */
  const [leaveBusy, setLeaveBusy] = useState(false);

  const [formKYear, setFormKYear] = useState(currentYear);
  const [formKWorkOrderId, setFormKWorkOrderId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchWorkOrders());
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
  }, [dispatch]);

  const loadBonusChecklistData = useCallback(async () => {
    const [wagesList, attList] = await Promise.all([
      dispatch(fetchWagesForFinancialYear(bonusYear)).unwrap(),
      dispatch(fetchAttendanceForFinancialYear(bonusYear)).unwrap(),
    ]);
    return buildBonusChecklistData({
      fyEndYear: bonusYear,
      workOrderId: bonusWorkOrderId || undefined,
      employees,
      workOrders,
      designations,
      wages: wagesList,
      attendances: attList,
    });
  }, [dispatch, bonusYear, bonusWorkOrderId, employees, workOrders, designations]);

  const handleGenerateBonusChecklist = useCallback(async () => {
    setBonusBusy(true);
    try {
      const data = await loadBonusChecklistData();
      if (data.rows.length === 0) {
        toast.warning(
          "No wages in this financial year for the selected work order filter.",
        );
        return;
      }
      await openPDFInNewTab(
        createElement(BonusChecklistPDF, {
          data,
          documentTitle: "BONUS REGISTER CHECK LIST",
        }),
      );
      toast.success("Bonus checklist PDF generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate bonus checklist PDF.");
    } finally {
      setBonusBusy(false);
    }
  }, [loadBonusChecklistData]);

  const handleBonusChecklistExcel = useCallback(async () => {
    setBonusBusy(true);
    try {
      const data = await loadBonusChecklistData();
      if (data.rows.length === 0) {
        toast.warning(
          "No wages in this financial year for the selected work order filter.",
        );
        return;
      }
      await generateBonusChecklistExcel(data, "BONUS REGISTER CHECK LIST", "BonusChecklist");
      toast.success("Bonus checklist Excel generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate bonus checklist Excel.");
    } finally {
      setBonusBusy(false);
    }
  }, [loadBonusChecklistData]);

  const handleGenerateBonusRegister = useCallback(async () => {
    const pct = parseBonusPercentageInput(bonusPercentage);
    if (pct === null) {
      toast.error("Enter a valid bonus percentage (e.g. 8.33).");
      return;
    }
    setBonusBusy(true);
    try {
      const checklist = await loadBonusChecklistData();
      if (checklist.rows.length === 0) {
        toast.warning(
          "No wages in this financial year for the selected work order filter.",
        );
        return;
      }
      const registerData = buildBonusRegisterData({
        checklist,
        employees,
        designations,
        bonusPercentage: pct,
      });
      await openPDFInNewTab(createElement(BonusRegisterPDF, { data: registerData }));
      toast.success("Bonus register (Form C) PDF generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate bonus register PDF.");
    } finally {
      setBonusBusy(false);
    }
  }, [
    bonusPercentage,
    designations,
    employees,
    loadBonusChecklistData,
  ]);

  const handleBonusRegisterExcel = useCallback(async () => {
    const pct = parseBonusPercentageInput(bonusPercentage);
    if (pct === null) {
      toast.error("Enter a valid bonus percentage (e.g. 8.33).");
      return;
    }
    setBonusBusy(true);
    try {
      const checklist = await loadBonusChecklistData();
      if (checklist.rows.length === 0) {
        toast.warning(
          "No wages in this financial year for the selected work order filter.",
        );
        return;
      }
      const registerData = buildBonusRegisterData({
        checklist,
        employees,
        designations,
        bonusPercentage: pct,
      });
      await generateBonusRegisterExcel(registerData, "BonusRegister_FormC");
      toast.success("Bonus register (Form C) Excel generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate bonus register Excel.");
    } finally {
      setBonusBusy(false);
    }
  }, [
    bonusPercentage,
    designations,
    employees,
    loadBonusChecklistData,
  ]);

  const loadLeaveChecklistData = useCallback(async () => {
    const attList = await dispatch(fetchAttendanceForCalendarYear(leaveYear)).unwrap();
    return buildLeaveRegisterChecklistData({
      calendarYear: leaveYear,
      workOrderId: leaveWorkOrderId || undefined,
      employees,
      workOrders,
      attendances: attList,
    });
  }, [dispatch, leaveYear, leaveWorkOrderId, employees, workOrders]);

  const handleGenerateLeaveChecklistPdf = useCallback(async () => {
    setLeaveBusy(true);
    try {
      const data = await loadLeaveChecklistData();
      if (data.rows.length === 0) {
        toast.warning(
          "No attendance in this calendar year for the selected work order filter.",
        );
        return;
      }
      await openPDFInNewTab(createElement(LeaveChecklistPDF, { data }));
      toast.success("Leave checklist PDF generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate leave checklist PDF.");
    } finally {
      setLeaveBusy(false);
    }
  }, [loadLeaveChecklistData]);

  const handleLeaveChecklistExcel = useCallback(async () => {
    setLeaveBusy(true);
    try {
      const data = await loadLeaveChecklistData();
      if (data.rows.length === 0) {
        toast.warning(
          "No attendance in this calendar year for the selected work order filter.",
        );
        return;
      }
      await generateLeaveChecklistExcel(data, "LeaveChecklist");
      toast.success("Leave checklist Excel generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate leave checklist Excel.");
    } finally {
      setLeaveBusy(false);
    }
  }, [loadLeaveChecklistData]);

  const loadLeavePaymentRegisterData = useCallback(async () => {
    const [wagesList, attList] = await Promise.all([
      dispatch(fetchWagesForCalendarYear(leaveYear)).unwrap(),
      dispatch(fetchAttendanceForCalendarYear(leaveYear)).unwrap(),
    ]);
    return buildLeavePaymentRegisterData({
      calendarYear: leaveYear,
      workOrderId: leaveWorkOrderId || undefined,
      employees,
      workOrders,
      designations,
      wages: wagesList,
      attendances: attList,
    });
  }, [dispatch, leaveYear, leaveWorkOrderId, employees, workOrders, designations]);

  const handleLeaveRegisterPdf = useCallback(async () => {
    setLeaveBusy(true);
    try {
      const data = await loadLeavePaymentRegisterData();
      if (data.rows.length === 0) {
        toast.warning(
          "No wages in this calendar year for the selected work order filter.",
        );
        return;
      }
      await openPDFInNewTab(createElement(LeavePaymentRegisterPDF, { data }));
      toast.success("Leave register (Form XVII) PDF generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate leave register PDF.");
    } finally {
      setLeaveBusy(false);
    }
  }, [loadLeavePaymentRegisterData]);

  const handleLeaveRegisterExcel = useCallback(async () => {
    setLeaveBusy(true);
    try {
      const data = await loadLeavePaymentRegisterData();
      if (data.rows.length === 0) {
        toast.warning(
          "No wages in this calendar year for the selected work order filter.",
        );
        return;
      }
      await generateLeavePaymentRegisterExcel(data, "LeavePaymentRegister_FormXVII");
      toast.success("Leave register (Form XVII) Excel generated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate leave register Excel.");
    } finally {
      setLeaveBusy(false);
    }
  }, [loadLeavePaymentRegisterData]);

  const handleGenerateFormK = () => {
    toast.info("Generate Form K — to be implemented");
  };

  const fyStart = bonusYear - 1;

  return (
    <div className="space-y-6 w-full">
      <div className="border-b border-border pb-2">
        <h1 className="text-2xl font-bold text-primary text-center">Leave & Bonus</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">Bonus Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Year (financial year ends March)</Label>
                <Select value={String(bonusYear)} onValueChange={(v) => setBonusYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  FY {fyStart}–{bonusYear} (01-04-{fyStart} to 31-03-{bonusYear})
                </p>
              </div>
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Select
                  value={bonusWorkOrderId || "default"}
                  onValueChange={(v) => setBonusWorkOrderId(v === "default" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Work Order No." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (all)</SelectItem>
                    {workOrders.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.workOrderNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Bonus Percentage</Label>
                <Input
                  type="text"
                  value={bonusPercentage}
                  onChange={(e) => setBonusPercentage(e.target.value)}
                  placeholder="8.33"
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <Button
                onClick={() => void handleGenerateBonusChecklist()}
                disabled={bonusBusy}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {bonusBusy ? "Working…" : "Generate Bonus Checklist"}
              </Button>
              <Button
                onClick={() => void handleGenerateBonusRegister()}
                disabled={bonusBusy}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {bonusBusy ? "Working…" : "Generate Bonus Register"}
              </Button>
              <Button
                onClick={() => void handleBonusRegisterExcel()}
                disabled={bonusBusy}
                variant="secondary"
                className="min-w-[200px]"
              >
                Bonus Register Excel
              </Button>
              <Button
                onClick={() => void handleBonusChecklistExcel()}
                disabled={bonusBusy}
                variant="secondary"
                className="min-w-[200px]"
              >
                Bonus Checklist Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">
              Leave checklist & register
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Year (January–December)</Label>
                <Select value={String(leaveYear)} onValueChange={(v) => setLeaveYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work order (optional)</Label>
                <Select
                  value={leaveWorkOrderId || "default"}
                  onValueChange={(v) => setLeaveWorkOrderId(v === "default" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Work Order No." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">All</SelectItem>
                    {workOrders.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.workOrderNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <Button
                type="button"
                onClick={() => void handleGenerateLeaveChecklistPdf()}
                disabled={leaveBusy}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {leaveBusy ? "Working…" : "Generate Leave Checklist (PDF)"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleLeaveRegisterPdf()}
                disabled={leaveBusy}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {leaveBusy ? "Working…" : "Generate Leave Register (PDF)"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleLeaveChecklistExcel()}
                disabled={leaveBusy}
                className="min-w-[200px]"
              >
                Leave Checklist Excel
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleLeaveRegisterExcel()}
                disabled={leaveBusy}
                className="min-w-[200px]"
              >
                Leave Register Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">Form K form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(formKYear)} onValueChange={(v) => setFormKYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Select
                  value={formKWorkOrderId || "default"}
                  onValueChange={(v) => setFormKWorkOrderId(v === "default" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Work Order No." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    {workOrders.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.workOrderNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <Button
                onClick={handleGenerateFormK}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Generate Form K
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default LeaveBonusPage;
