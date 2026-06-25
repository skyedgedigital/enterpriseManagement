import { useEffect, useState } from "react";
import { createElement } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS, INDIAN_STATES_AND_UTS } from "@/lib/constants";
import { wagesService } from "@/services/wages.service";
import { buildPFReport } from "@/lib/generatePFReport";
import { buildESICReport } from "@/lib/generateESICReport";
import { PFReportPDF } from "@/components/pdf/PFReportPDF";
import { ESICReportPDF } from "@/components/pdf/ESICReportPDF";
import { openPDFInNewTab } from "@/lib/pdfUtils";
import { generatePFReportExcel } from "@/lib/excel/generatePFReportExcel";
import { generateESICReportExcel } from "@/lib/excel/generateESICReportExcel";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);

export function PfEsicPage() {
  const dispatch = useAppDispatch();
  const departments = useAppSelector((s) => s.departments.items);
  const employees = useAppSelector((s) => s.employees.items);
  const designations = useAppSelector((s) => s.designations.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);

  const [pfYear, setPfYear] = useState(currentYear);
  const [pfMonth, setPfMonth] = useState(new Date().getMonth() + 1);
  const [pfDepartmentId, setPfDepartmentId] = useState<string>("");
  const [pfGenerating, setPfGenerating] = useState(false);

  const [esicYear, setEsicYear] = useState(currentYear);
  const [esicMonth, setEsicMonth] = useState(new Date().getMonth() + 1);
  const [esicState, setEsicState] = useState<string>("");
  const [esicGenerating, setEsicGenerating] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const handleGeneratePF = async () => {
    setPfGenerating(true);
    try {
      const wages = await wagesService.getByFilter({
        year: pfYear,
        month: pfMonth,
      });
      const rows = buildPFReport({
        employees,
        wages,
        designations,
        workOrders,
        year: pfYear,
        month: pfMonth,
        departmentId: pfDepartmentId || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          "No PF data for the selected year, month and department. Ensure wages exist for this period and employees are not marked PF not applicable.",
        );
        return;
      }
      const departmentName = pfDepartmentId
        ? departments.find((d) => d.id === pfDepartmentId)?.name
        : undefined;
      const doc = createElement(PFReportPDF, {
        rows,
        year: pfYear,
        month: pfMonth,
        departmentName,
      });
      await openPDFInNewTab(doc);
      toast.success("PF report PDF generated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PF PDF");
    } finally {
      setPfGenerating(false);
    }
  };

  const handleGeneratePFExcel = async () => {
    setPfGenerating(true);
    try {
      const wages = await wagesService.getByFilter({
        year: pfYear,
        month: pfMonth,
      });
      const rows = buildPFReport({
        employees,
        wages,
        designations,
        workOrders,
        year: pfYear,
        month: pfMonth,
        departmentId: pfDepartmentId || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          "No PF data for the selected year, month and department. Ensure wages exist for this period and employees are not marked PF not applicable.",
        );
        return;
      }
      const departmentName = pfDepartmentId
        ? departments.find((d) => d.id === pfDepartmentId)?.name
        : undefined;
      await generatePFReportExcel({
        rows,
        year: pfYear,
        month: pfMonth,
        departmentName,
      });
      toast.success("PF report Excel generated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate PF Excel");
    } finally {
      setPfGenerating(false);
    }
  };

  const handleGenerateESIC = async () => {
    setEsicGenerating(true);
    try {
      const wages = await wagesService.getByFilter({
        year: esicYear,
        month: esicMonth,
      });
      const rows = buildESICReport({
        employees,
        wages,
        workOrders,
        designations,
        year: esicYear,
        month: esicMonth,
        state: esicState || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          "No ESIC data for the selected year, month and state. Ensure wages exist for this period, work orders match the state filter if set, and employees are not marked ESIC not applicable.",
        );
        return;
      }
      const doc = createElement(ESICReportPDF, {
        rows,
        year: esicYear,
        month: esicMonth,
        stateName: esicState || undefined,
      });
      await openPDFInNewTab(doc);
      toast.success("ESIC report PDF generated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate ESIC PDF");
    } finally {
      setEsicGenerating(false);
    }
  };

  const handleGenerateESICExcel = async () => {
    setEsicGenerating(true);
    try {
      const wages = await wagesService.getByFilter({
        year: esicYear,
        month: esicMonth,
      });
      const rows = buildESICReport({
        employees,
        wages,
        workOrders,
        designations,
        year: esicYear,
        month: esicMonth,
        state: esicState || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          "No ESIC data for the selected year, month and state. Ensure wages exist for this period, work orders match the state filter if set, and employees are not marked ESIC not applicable.",
        );
        return;
      }
      await generateESICReportExcel({
        rows,
        year: esicYear,
        month: esicMonth,
        stateName: esicState || undefined,
      });
      toast.success("ESIC report Excel generated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate ESIC Excel");
    } finally {
      setEsicGenerating(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="border-b border-border pb-2">
        <h1 className="text-2xl font-bold text-primary text-center">
          PF ESIC
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Left card: PF Form */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">
              PF Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(pfYear)} onValueChange={(v) => setPfYear(Number(v))}>
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
                <Label>Month</Label>
                <Select value={String(pfMonth)} onValueChange={(v) => setPfMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Department</Label>
                <Select value={pfDepartmentId || "all"} onValueChange={(v) => setPfDepartmentId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center mt-3 gap-2">
              <Button
                onClick={handleGeneratePF}
                disabled={pfGenerating}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {pfGenerating ? "Generating…" : "Generate PF"}
              </Button>
              <Button
                onClick={handleGeneratePFExcel}
                disabled={pfGenerating}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {pfGenerating ? "Generating…" : "PF Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right card: ESIC Form */}
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">
              ESIC Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(esicYear)} onValueChange={(v) => setEsicYear(Number(v))}>
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
                <Label>Month</Label>
                <Select value={String(esicMonth)} onValueChange={(v) => setEsicMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>ESI State</Label>
                <Select value={esicState || "all"} onValueChange={(v) => setEsicState(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ESI State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {INDIAN_STATES_AND_UTS.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center mt-3 gap-2">
              <Button
                onClick={handleGenerateESIC}
                disabled={esicGenerating}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {esicGenerating ? "Generating…" : "Generate ESIC"}
              </Button>
              <Button
                onClick={handleGenerateESICExcel}
                disabled={esicGenerating}
                className="min-w-[200px] bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {esicGenerating ? "Generating…" : "ESIC Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default PfEsicPage;
