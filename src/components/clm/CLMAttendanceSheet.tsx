import { useMemo, useCallback, useState, useEffect } from "react";
import { Save, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchAttendanceByFilter, addAttendance, updateAttendance } from "@/store/slices/attendanceSlice";
import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_DISPLAY, NATIONAL_HOLIDAYS } from "@/lib/constants";
import { getWeeklyAllowanceSummaryFromAttendance } from "@/lib/paymentCalculation";
import { fetchAndValidateLeaveEntitlement } from "@/lib/clm/leaveEntitlement";
import type { AttendanceDay, AttendanceStatus } from "@/types";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isSunday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 0;
}

function isNationalHoliday(day: number, month: number): boolean {
  return NATIONAL_HOLIDAYS.some((h) => h.day === day && h.month === month);
}

function getDefaultStatusForDay(year: number, month: number, day: number): AttendanceStatus {
  if (isNationalHoliday(day, month)) return "NH";
  if (isSunday(year, month, day)) return "Not Paid";
  return "Present";
}

export interface CLMAttendanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  employeeName: string;
  year: number;
  month: number;
  workOrderId: string | null;
  onSaved?: () => void;
}

export function CLMAttendanceSheet({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  year,
  month,
  workOrderId,
  onSaved,
}: CLMAttendanceSheetProps) {
  const dispatch = useAppDispatch();
  const { items: attendances, loading } = useAppSelector((s) => s.attendances);
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [saving, setSaving] = useState(false);

  const existingRecord = useMemo(() => {
    if (!employeeId) return null;
    return attendances.find(
      (a) => a.employee === employeeId && a.year === year && a.month === month
    );
  }, [attendances, employeeId, year, month]);

  const loadAttendance = useCallback(() => {
    if (!employeeId) return;
    dispatch(
      fetchAttendanceByFilter({
        employeeId,
        year,
        month,
      })
    );
  }, [dispatch, employeeId, year, month]);

  useEffect(() => {
    if (open && employeeId) loadAttendance();
  }, [open, employeeId, loadAttendance]);

  useEffect(() => {
    if (!open) return;
    if (existingRecord?.days && existingRecord.days.length > 0) {
      setDays(existingRecord.days.map((d) => ({ ...d })));
    } else {
      const totalDays = getDaysInMonth(year, month);
      setDays(
        Array.from({ length: totalDays }, (_, i) => {
          const d = i + 1;
          return {
            day: d,
            status: getDefaultStatusForDay(year, month, d),
            workOrderHr: workOrderId ?? undefined,
          };
        })
      );
    }
  }, [existingRecord, year, month, open, workOrderId]);

  /** Effective work-order tag for a day, with record-level fallback for legacy data. */
  const effectiveTagFor = useCallback(
    (day: AttendanceDay): string | undefined => {
      if (day.workOrderHr && day.workOrderHr.trim() !== "") return day.workOrderHr;
      const recTag = existingRecord?.workOrderHr;
      return recTag && recTag.trim() !== "" ? recTag : undefined;
    },
    [existingRecord],
  );

  const isDayLocked = useCallback(
    (day: AttendanceDay): boolean => {
      if (!workOrderId) return false;
      if (!day.workOrderHr || day.workOrderHr.trim() === "") return false;
      if (day.workOrderHr === workOrderId) return false;
      // A day owned by a different work order is only locked while it holds a "committed"
      // status (the employee actually worked or took leave that day). Absent / Not Paid days
      // remain editable so the user can freely re-attribute unused days when the employee
      // picks up work on another order mid-month. Going back to the owning WO's sheet and
      // marking a day Absent therefore releases it for other work orders.
      const committed: AttendanceDay["status"][] = [
        "Present",
        "Half Day",
        "Earned Leave",
        "Casual Leave",
        "Festival Leave",
        "NH",
      ];
      return committed.includes(day.status);
    },
    [workOrderId],
  );

  const workOrderLabelById = useCallback(
    (id: string | undefined): string => {
      if (!id) return "";
      return workOrders.find((w) => w.id === id)?.workOrderNumber ?? "WO";
    },
    [workOrders],
  );

  /** Counts for the work-order-scoped view shown in the summary row. */
  const summary = useMemo(() => {
    let present = 0,
      absent = 0,
      halfDay = 0,
      nh = 0,
      notPaid = 0,
      el = 0,
      cl = 0,
      fl = 0;
    for (const d of days) {
      const tag = effectiveTagFor(d);
      // When no WO filter is applied, count everything. Otherwise count only days that
      // effectively belong to the current work order.
      if (workOrderId && tag !== workOrderId) continue;
      if (d.status === "Present") present++;
      else if (d.status === "Absent") absent++;
      else if (d.status === "Half Day") {
        halfDay++;
        present += 0.5;
      } else if (d.status === "NH") nh++;
      else if (d.status === "Not Paid") notPaid++;
      else if (d.status === "Earned Leave") el++;
      else if (d.status === "Casual Leave") cl++;
      else if (d.status === "Festival Leave") fl++;
    }
    return { present, absent, halfDay, nh, notPaid, el, cl, fl };
  }, [days, effectiveTagFor, workOrderId]);

  const weeklyAllowanceSummary = useMemo(() => {
    const scoped = workOrderId
      ? days.filter((d) => effectiveTagFor(d) === workOrderId)
      : days;
    return getWeeklyAllowanceSummaryFromAttendance(
      [...scoped].sort((a, b) => a.day - b.day),
      year,
      month,
    );
  }, [days, effectiveTagFor, workOrderId, year, month]);

  const updateDay = useCallback(
    (dayIndex: number, status: AttendanceStatus) => {
      setDays((prev) =>
        prev.map((d, i) =>
          i === dayIndex
            ? {
                ...d,
                status,
                // Editing a day under a work-order context claims (or re-claims) ownership
                // for that work order, so future views from other WOs see this day as locked.
                workOrderHr: workOrderId ?? d.workOrderHr,
              }
            : d,
        ),
      );
    },
    [workOrderId],
  );

  const handleSave = useCallback(async () => {
    if (!employeeId) return;
    setSaving(true);
    // Commit fallback attribution: any untagged day whose effective tag matches the current
    // work order (via the record-level fallback) gets an explicit day-level tag on save. This
    // migrates legacy records to the new per-day model incrementally, without disturbing days
    // that effectively belong to another work order.
    const daysToSave: AttendanceDay[] = days.map((d) => {
      if (d.workOrderHr && d.workOrderHr.trim() !== "") return d;
      const effectiveTag = effectiveTagFor(d);
      if (workOrderId && effectiveTag === workOrderId) {
        return { ...d, workOrderHr: workOrderId };
      }
      return d;
    });

    // The record-level aggregate fields (presentDays, leaves, weekly allowance) describe the
    // whole month across every work order so legacy consumers that read them directly still
    // get a correct month-wide value. Per-WO consumers derive their counts via
    // getAttendanceSliceForWorkOrder.
    // NH (National Holiday) is a paid leave and counts as a full day in presentDays.
    let monthPresentDays = 0;
    let monthEl = 0;
    let monthCl = 0;
    let monthFl = 0;
    for (const d of daysToSave) {
      if (d.status === "Present" || d.status === "NH") monthPresentDays += 1;
      else if (d.status === "Half Day") monthPresentDays += 0.5;
      else if (d.status === "Earned Leave") monthEl += 1;
      else if (d.status === "Casual Leave") monthCl += 1;
      else if (d.status === "Festival Leave") monthFl += 1;
    }
    const monthWeekly = getWeeklyAllowanceSummaryFromAttendance(daysToSave, year, month);

    // Strict entitlement gate — EL/CL/FL are only as many as the year-to-date present-day
    // formula allows. A user cannot override this by picking a leave in the dropdown.
    const validation = await fetchAndValidateLeaveEntitlement({
      employeeId,
      year,
      editedMonth: month,
      editedDays: daysToSave,
    });
    if (!validation.ok) {
      toast.error(validation.failure.message);
      setSaving(false);
      return;
    }

    const payload = {
      employee: employeeId,
      year,
      month,
      days: daysToSave,
      presentDays: monthPresentDays,
      earnedLeaves: monthEl,
      casualLeaves: monthCl,
      festivalLeaves: monthFl,
      continuousWeeks: monthWeekly.continuousWeeks,
      weeklyAllowanceDays: monthWeekly.weeklyAllowanceDays,
      weeklyAllowanceAmount: monthWeekly.weeklyAllowanceAmount,
      workOrderHr: workOrderId || undefined,
    };
    if (existingRecord) {
      const result = await dispatch(
        updateAttendance({ id: existingRecord.id, data: payload })
      );
      if (updateAttendance.fulfilled.match(result)) {
        toast.success("Attendance updated");
        onSaved?.();
      } else toast.error(result.payload as string);
    } else {
      const result = await dispatch(addAttendance(payload));
      if (addAttendance.fulfilled.match(result)) {
        toast.success("Attendance saved");
        onSaved?.();
      } else toast.error(result.payload as string);
    }
    setSaving(false);
  }, [
    employeeId,
    year,
    month,
    days,
    effectiveTagFor,
    workOrderId,
    existingRecord,
    dispatch,
    onSaved,
  ]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const calendarCells = useMemo(() => {
    const cells: { day: number | null; dayIndex: number | null }[] = [];
    for (let i = 0; i < 42; i++) {
      const dayNum = i - firstDayOfWeek + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push({ day: null, dayIndex: null });
      } else {
        cells.push({ day: dayNum, dayIndex: dayNum - 1 });
      }
    }
    return cells;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const isDefaultFilled = !existingRecord?.days?.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Attendance Sheet — {employeeName}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {isDefaultFilled && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
              This is Default Pre-Filled Attendance
            </div>
          )}
          {workOrderId && (
            <div className="rounded-md bg-muted/50 text-muted-foreground px-3 py-2 text-xs">
              Showing totals for work order <span className="font-medium text-foreground">{workOrderLabelById(workOrderId)}</span>. Days already locked to another work order are read-only.
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-600 font-medium">Present {Math.round(summary.present * 10) / 10}</span>
            <span className="text-red-600 font-medium">Absent {summary.absent}</span>
            <span className="text-muted-foreground">Half Day (HD) {summary.halfDay}</span>
            <span className="text-muted-foreground">National Holiday (NH) {summary.nh}</span>
            <span className="text-blue-700 dark:text-blue-400 font-medium">Not Paid (NP) {summary.notPaid}</span>
            <span className="text-muted-foreground">Earned Leaves (EL) {summary.el}</span>
            <span className="text-muted-foreground">Casual Leaves (CL) {summary.cl}</span>
            <span className="text-muted-foreground">Festival Leaves (FL) {summary.fl}</span>
            <span className="text-primary font-medium">
              Continuous weeks {weeklyAllowanceSummary.continuousWeeks}
            </span>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <TableRowHeader />
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4, 5].map((rowIdx) => (
                  <tr key={rowIdx}>
                    {DAY_LABELS.map((_, colIdx) => {
                      const cell = calendarCells[rowIdx * 7 + colIdx];
                      const { day, dayIndex } = cell;
                      if (day === null || dayIndex === null) {
                        return <td key={colIdx} className="border p-1 bg-muted/30 min-w-[100px]" />;
                      }
                      const dayData = days[dayIndex];
                      if (!dayData) return <td key={colIdx} className="border p-1" />;
                      const locked = isDayLocked(dayData);
                      const tag = effectiveTagFor(dayData);
                      const showOtherWoBadge = workOrderId != null && tag != null && tag !== workOrderId;
                      return (
                        <td
                          key={colIdx}
                          className={`border p-1 align-top min-w-[100px] ${locked ? "bg-muted/40" : ""}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-muted-foreground">{day}</span>
                            {showOtherWoBadge && (
                              <span
                                className="text-[10px] font-medium px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 flex items-center gap-0.5"
                                title={locked ? `Locked — belongs to ${workOrderLabelById(tag)}` : `Currently attributed to ${workOrderLabelById(tag)}; editing transfers it to this work order`}
                              >
                                {locked && <Lock className="h-2.5 w-2.5" />}
                                {workOrderLabelById(tag)}
                              </span>
                            )}
                          </div>
                          <Select
                            value={dayData.status}
                            onValueChange={(v) => updateDay(dayIndex, v as AttendanceStatus)}
                            disabled={locked}
                          >
                            <SelectTrigger
                              className={`h-8 text-xs ${locked ? "bg-muted/60 text-muted-foreground" : "bg-primary/10 border-primary/20"}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {ATTENDANCE_STATUS_DISPLAY[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TableRowHeader() {
  return (
    <tr>
      {DAY_LABELS.map((label) => (
        <th
          key={label}
          className="border bg-amber-400 dark:bg-amber-600 text-amber-950 dark:text-amber-100 font-bold text-center py-2 px-1 min-w-[100px]"
        >
          {label}
        </th>
      ))}
    </tr>
  );
}
