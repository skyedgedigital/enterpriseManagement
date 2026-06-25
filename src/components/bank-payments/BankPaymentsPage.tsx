import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchBanks } from "@/store/slices/bankSlice";
import { fetchWagesByFilter } from "@/store/slices/wagesSlice";
import { fetchAttendanceByFilter } from "@/store/slices/attendanceSlice";
import {
  buildBankStatementPTAData,
  generateBankStatementPTA,
} from "@/lib/generateBankStatementPTA";
import { generateBankStatementPTAExcel } from "@/lib/excel/generateBankStatementPTAExcel";
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
import { MONTHS } from "@/lib/constants";

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);

export function BankPaymentsPage() {
  const dispatch = useAppDispatch();
  const departments = useAppSelector((s) => s.departments.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const employees = useAppSelector((s) => s.employees.items);
  const banks = useAppSelector((s) => s.banks.items);

  // Bank Statement form (left card) – independent state
  const [bankYear, setBankYear] = useState(currentYear);
  const [bankMonth, setBankMonth] = useState(new Date().getMonth() + 1);
  const [bankDepartmentId, setBankDepartmentId] = useState<string>("");
  const [bankWorkOrderId, setBankWorkOrderId] = useState<string>("");

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchWorkOrders());
    dispatch(fetchEmployees());
    dispatch(fetchBanks());
  }, [dispatch]);

  const handleGenerateBankStatement = useCallback(async () => {
    try {
      const wagesList = await dispatch(
        fetchWagesByFilter({ year: bankYear, month: bankMonth })
      ).unwrap();
      const attendanceList = await dispatch(
        fetchAttendanceByFilter({ year: bankYear, month: bankMonth })
      ).unwrap();
      await generateBankStatementPTA({
        employees,
        wages: wagesList,
        attendances: attendanceList,
        banks,
        workOrders,
        year: bankYear,
        month: bankMonth,
        workOrderId: bankWorkOrderId,
        departmentId: bankDepartmentId || undefined,
      });
      toast.success("Bank statement generated.");
    } catch (err) {
      console.error("Bank statement generation failed", err);
      toast.error("Failed to generate bank statement.");
    }
  }, [
    dispatch,
    employees,
    banks,
    bankYear,
    bankMonth,
    bankWorkOrderId,
    bankDepartmentId,
  ]);

  const handleGenerateBankStatementExcel = useCallback(async () => {
    try {
      const wagesList = await dispatch(
        fetchWagesByFilter({ year: bankYear, month: bankMonth })
      ).unwrap();
      const attendanceList = await dispatch(
        fetchAttendanceByFilter({ year: bankYear, month: bankMonth })
      ).unwrap();
      const data = buildBankStatementPTAData({
        employees,
        wages: wagesList,
        attendances: attendanceList,
        banks,
        workOrders,
        year: bankYear,
        month: bankMonth,
        workOrderId: bankWorkOrderId,
        departmentId: bankDepartmentId || undefined,
      });
      await generateBankStatementPTAExcel(data);
      toast.success("Bank statement Excel generated.");
    } catch (err) {
      console.error("Bank statement Excel generation failed", err);
      toast.error("Failed to generate bank statement Excel.");
    }
  }, [
    dispatch,
    employees,
    banks,
    workOrders,
    bankYear,
    bankMonth,
    bankWorkOrderId,
    bankDepartmentId,
  ]);

  return (
    <div className="space-y-6 w-full">
      <div className="border-b border-border pb-2">
        <h1 className="text-2xl font-bold text-primary text-center">
          Bank Payments
        </h1>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg font-semibold text-foreground">
              Bank Statement Form
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(bankYear)} onValueChange={(v) => setBankYear(Number(v))}>
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
                <Select value={String(bankMonth)} onValueChange={(v) => setBankMonth(Number(v))}>
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
                <Select value={bankDepartmentId || "all"} onValueChange={(v) => setBankDepartmentId(v === "all" ? "" : v)}>
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Work Order</Label>
                <Select value={bankWorkOrderId || "default"} onValueChange={(v) => setBankWorkOrderId(v === "default" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
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
            <div className="flex justify-center mt-3 gap-2">
              <Button onClick={handleGenerateBankStatement} className="min-w-[200px]">
                Generate Bank Statement
              </Button>
              <Button onClick={handleGenerateBankStatementExcel} className="min-w-[200px]">
                Bank Statement Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BankPaymentsPage;