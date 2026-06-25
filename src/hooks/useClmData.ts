import { useEffect, useMemo, useCallback } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchBanks } from "@/store/slices/bankSlice";
import { fetchSites } from "@/store/slices/siteSlice";
import { fetchEsiLocations } from "@/store/slices/esiLocationSlice";
import { getAttendanceSliceForWorkOrder } from "@/lib/attendanceSlice";
import type { CLMEmployeeRow } from "@/components/clm/CLMEmployeeTable";
import type { Employee } from "@/types";

export interface UseClmDataOptions {
  year: number;
  month: number;
  workOrderId: string;
  period: string;
  listShown: boolean;
}

/**
 * Single source of truth for CLM page data.
 *
 * - Triggers master-data fetches once on mount.
 * - Selects shared Redux state (employees, wages, attendances, workOrders, designations).
 * - Derives the table rows and helper lookups used by the CLM page and its child sheets.
 */
export function useClmData({
  year,
  month,
  workOrderId,
  period,
  listShown,
}: UseClmDataOptions) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchWorkOrders());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    dispatch(fetchBanks());
    dispatch(fetchSites());
    dispatch(fetchEsiLocations());
  }, [dispatch]);

  const employees = useAppSelector((s) => s.employees.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const attendances = useAppSelector((s) => s.attendances.items);
  const wages = useAppSelector((s) => s.wages.items);
  const designations = useAppSelector((s) => s.designations.items);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const woList = emp.workOrderHr ?? [];
      const hasPeriod = woList.some((wo) => wo.period === period);
      if (!hasPeriod) return false;
      if (!workOrderId) return true;
      return woList.some(
        (wo) => wo.workOrderHr === workOrderId && wo.period === period,
      );
    });
  }, [employees, workOrderId, period]);

  /** Employees eligible to be added to the currently selected work order. */
  const availableToAdd = useMemo(() => {
    if (!workOrderId) return [];
    const inListIds = new Set(filteredEmployees.map((e) => e.id));
    return employees.filter((e) => !inListIds.has(e.id));
  }, [employees, filteredEmployees, workOrderId]);

  const attendancesForPeriod = useMemo(() => {
    const byEmployee = new Map<string, { presentDays: number; id: string }>();
    for (const a of attendances) {
      if (a.year !== year || a.month !== month) continue;
      const slice = getAttendanceSliceForWorkOrder(a, workOrderId || null);
      byEmployee.set(a.employee, { presentDays: slice.presentDays, id: a.id });
    }
    return byEmployee;
  }, [attendances, year, month, workOrderId]);

  const wagesFilledForPeriod = useMemo(() => {
    const set = new Set<string>();
    for (const w of wages) {
      if (w.year !== year || w.month !== month) continue;
      if (workOrderId) {
        if (w.workOrderHr === workOrderId) set.add(w.employee);
      } else {
        set.add(w.employee);
      }
    }
    return set;
  }, [wages, year, month, workOrderId]);

  const tableRows: CLMEmployeeRow[] = useMemo(() => {
    if (!listShown) return [];
    return filteredEmployees.map((emp) => {
      const att = attendancesForPeriod.get(emp.id);
      return {
        employee: emp,
        attendanceSummary: att?.presentDays ?? 0,
        wagesStatus: wagesFilledForPeriod.has(emp.id) ? "filled" : "Not filled",
        attendanceId: att?.id,
      };
    });
  }, [listShown, filteredEmployees, attendancesForPeriod, wagesFilledForPeriod]);

  const attendanceRecordForEmployee = useCallback(
    (emp: Employee) =>
      attendances.find(
        (a) => a.employee === emp.id && a.year === year && a.month === month,
      ) ?? null,
    [attendances, year, month],
  );

  const existingWagesForEmployee = useCallback(
    (emp: Employee) =>
      wages.find(
        (w) =>
          w.employee === emp.id &&
          w.year === year &&
          w.month === month &&
          (!workOrderId || w.workOrderHr === workOrderId),
      ) ?? null,
    [wages, year, month, workOrderId],
  );

  /**
   * All wage rows for an employee in the active (year, month), unfiltered by work order.
   *
   * Used by the Payment modal when no work order is selected so it can roll up
   * every work order's wages into a single combined payment view instead of
   * silently collapsing to the first row `.find()` happens to return.
   */
  const existingWagesListForEmployee = useCallback(
    (emp: Employee) =>
      wages.filter(
        (w) => w.employee === emp.id && w.year === year && w.month === month,
      ),
    [wages, year, month],
  );

  return {
    employees,
    workOrders,
    attendances,
    wages,
    designations,
    filteredEmployees,
    availableToAdd,
    tableRows,
    attendanceRecordForEmployee,
    existingWagesForEmployee,
    existingWagesListForEmployee,
  };
}
