import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchAttendanceByFilter, addAttendance, updateAttendance } from "@/store/slices/attendanceSlice";
import { ATTENDANCE_STATUSES, MONTHS, NATIONAL_HOLIDAYS } from "@/lib/constants";
import { fetchAndValidateLeaveEntitlement } from "@/lib/clm/leaveEntitlement";
import type { AttendanceDay, AttendanceStatus } from "@/types";

function isNationalHoliday(day: number, month: number): boolean {
  return NATIONAL_HOLIDAYS.some((h) => h.day === day && h.month === month);
}
function isSunday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 0;
}
function getDefaultStatusForDay(year: number, month: number, day: number): AttendanceStatus {
  if (isNationalHoliday(day, month)) return "NH";
  if (isSunday(year, month, day)) return "Not Paid";
  return "Present";
}

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { createAttendanceBulkConfig } from "@/lib/excel/bulkUpload/transactionBulkConfigs";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const statusColors: Record<AttendanceStatus, string> = {
  Present: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Absent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Half Day": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  NH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Not Paid": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  "Earned Leave": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Casual Leave": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Festival Leave": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
};

export function AttendancePage() {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((state) => state.employees.items);
  const workOrders = useAppSelector((state) => state.workOrders.items);
  const { items: attendances, loading } = useAppSelector((state) => state.attendances);

  const attendanceBulkConfig = useMemo(() => createAttendanceBulkConfig(), []);

  const now = new Date();
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedWorkOrder, setSelectedWorkOrder] = useState("");
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const existingRecord = useMemo(() => {
    return attendances.find(
      (a) => a.employee === selectedEmployee && a.year === selectedYear && a.month === selectedMonth
    );
  }, [attendances, selectedEmployee, selectedYear, selectedMonth]);

  const loadAttendance = useCallback(() => {
    if (!selectedEmployee) return;
    dispatch(fetchAttendanceByFilter({
      employeeId: selectedEmployee,
      year: selectedYear,
      month: selectedMonth,
    }));
  }, [dispatch, selectedEmployee, selectedYear, selectedMonth]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (existingRecord?.days) {
      setDays(existingRecord.days);
      setSelectedWorkOrder(existingRecord.workOrderHr ?? "");
    } else {
      const totalDays = getDaysInMonth(selectedYear, selectedMonth);
      setDays(
        Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1;
          return { day: d, status: getDefaultStatusForDay(selectedYear, selectedMonth, d) };
        })
      );
    }
  }, [existingRecord, selectedYear, selectedMonth]);

  const updateDay = (dayIndex: number, status: AttendanceStatus) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIndex ? { ...d, status } : d))
    );
  };

  const summary = useMemo(() => {
    // NH (National Holiday) is a paid leave: counts as a full day in presentDays
    // so downstream payment math, PF, ESI and incentives all include it.
    let presentDays = 0, earnedLeaves = 0, casualLeaves = 0, festivalLeaves = 0;
    for (const d of days) {
      if (d.status === "Present" || d.status === "NH") presentDays++;
      else if (d.status === "Half Day") presentDays += 0.5;
      else if (d.status === "Earned Leave") earnedLeaves++;
      else if (d.status === "Casual Leave") casualLeaves++;
      else if (d.status === "Festival Leave") festivalLeaves++;
    }
    return { presentDays, earnedLeaves, casualLeaves, festivalLeaves };
  }, [days]);

  const handleSave = async () => {
    if (!selectedEmployee) { toast.error("Please select an employee"); return; }
    setSaving(true);

    // Strict entitlement gate — EL/CL/FL counts must fit inside the year-to-date
    // formula in liveRegisterLeaveEntitlements. A user cannot override this.
    const validation = await fetchAndValidateLeaveEntitlement({
      employeeId: selectedEmployee,
      year: selectedYear,
      editedMonth: selectedMonth,
      editedDays: days,
    });
    if (!validation.ok) {
      toast.error(validation.failure.message);
      setSaving(false);
      return;
    }

    const payload = {
      employee: selectedEmployee,
      year: selectedYear,
      month: selectedMonth,
      days,
      presentDays: summary.presentDays,
      earnedLeaves: summary.earnedLeaves,
      casualLeaves: summary.casualLeaves,
      festivalLeaves: summary.festivalLeaves,
      workOrderHr: selectedWorkOrder || undefined,
    };

    if (existingRecord) {
      const result = await dispatch(updateAttendance({ id: existingRecord.id, data: payload }));
      if (updateAttendance.fulfilled.match(result)) toast.success("Attendance updated");
      else toast.error(result.payload as string);
    } else {
      const result = await dispatch(addAttendance(payload));
      if (addAttendance.fulfilled.match(result)) toast.success("Attendance saved");
      else toast.error(result.payload as string);
    }
    setSaving(false);
  };

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Mark and manage monthly attendance"
        action={
          <BulkUploadDialog
            config={attendanceBulkConfig}
            context={{ employees, workOrders }}
            onSuccess={() => loadAttendance()}
          />
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name || e.code}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Work Order (Optional)</Label>
              <Select value={selectedWorkOrder} onValueChange={setSelectedWorkOrder}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {workOrders.map((w) => (<SelectItem key={w.id} value={w.id}>{w.workOrderNumber}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && !loading && (
        <>
          {/* Summary */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{summary.presentDays}</p><p className="text-xs text-muted-foreground">Present Days</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-purple-600">{summary.earnedLeaves}</p><p className="text-xs text-muted-foreground">Earned Leaves</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-orange-600">{summary.casualLeaves}</p><p className="text-xs text-muted-foreground">Casual Leaves</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-pink-600">{summary.festivalLeaves}</p><p className="text-xs text-muted-foreground">Festival Leaves</p></CardContent></Card>
          </div>

          {/* Attendance Grid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Daily Attendance</CardTitle>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {days.map((d, i) => (
                  <div key={d.day} className="flex items-center gap-2 rounded-lg border p-2">
                    <span className="w-8 text-center font-medium text-sm">{d.day}</span>
                    <Select value={d.status} onValueChange={(v) => updateDay(i, v as AttendanceStatus)}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge variant="outline" className={`${statusColors[s]} border-0 text-xs`}>{s}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && <LoadingState />}
    </div>
  );
}
