import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchEmployees,
  updateEmployee,
} from "@/store/slices/employeeSlice";
import {
  deleteAttendance,
  fetchAttendanceByFilter,
  updateAttendance,
} from "@/store/slices/attendanceSlice";
import {
  deleteWages,
  fetchWagesByFilter,
} from "@/store/slices/wagesSlice";
import { buildRemoveEmployeeAttendancePlan } from "@/lib/clm/helpers";
import type { Employee, EmployeeWorkOrder } from "@/types";

export interface UseClmEmployeeActionsOptions {
  year: number;
  month: number;
  workOrderId: string;
  period: string;
  onListShown: () => void;
}

/**
 * Owns the Add Employee + Remove Employee flows for the CLM page.
 *
 * Keeps all local UI state (dialog open flags, pending selection, loading)
 * colocated with the handlers so CLMPage just renders dialogs bound to the
 * returned slice.
 */
export function useClmEmployeeActions({
  year,
  month,
  workOrderId,
  period,
  onListShown,
}: UseClmEmployeeActionsOptions) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.employees.items);
  const attendances = useAppSelector((s) => s.attendances.items);
  const wages = useAppSelector((s) => s.wages.items);

  // Add flow ---------------------------------------------------------------
  const [addOpen, setAddOpen] = useState(false);

  const addEmployees = useCallback(
    async (employeeIds: string[]) => {
      if (!workOrderId) {
        toast.error("Please select a work order first.");
        return;
      }
      const newEntry: EmployeeWorkOrder = {
        period,
        workOrderHr: workOrderId,
        workOrderAtten: 0,
      };
      const results = await Promise.all(
        employeeIds.map((id) => {
          const emp = employees.find((e) => e.id === id);
          if (!emp) return Promise.resolve(null);
          const existing = emp.workOrderHr ?? [];
          const updated = [...existing];
          const idx = updated.findIndex(
            (wo) => wo.period === period && wo.workOrderHr === workOrderId,
          );
          if (idx >= 0) updated[idx] = newEntry;
          else updated.push(newEntry);
          return dispatch(updateEmployee({ id, data: { workOrderHr: updated } }));
        }),
      );
      const succeeded = results.filter(
        (r) => r && updateEmployee.fulfilled.match(r),
      ).length;
      if (succeeded > 0) {
        toast.success(
          `${succeeded} employee${succeeded !== 1 ? "s" : ""} added to work order.`,
        );
        dispatch(fetchEmployees());
        onListShown();
      }
      const failed = employeeIds.length - succeeded;
      if (failed > 0) {
        toast.error(
          `${failed} employee${failed !== 1 ? "s" : ""} failed to add.`,
        );
      }
    },
    [dispatch, employees, workOrderId, period, onListShown],
  );

  // Remove flow ------------------------------------------------------------
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);
  const [removing, setRemoving] = useState(false);

  const requestRemove = useCallback(
    (employee: Employee) => {
      if (!workOrderId) {
        toast.error("Select a work order first.");
        return;
      }
      setRemoveTarget(employee);
      setRemoveOpen(true);
    },
    [workOrderId],
  );

  const cancelRemove = useCallback(() => {
    if (removing) return;
    setRemoveOpen(false);
    setRemoveTarget(null);
  }, [removing]);

  const confirmRemove = useCallback(async () => {
    if (!removeTarget || !workOrderId) return;
    setRemoving(true);
    try {
      const existing = removeTarget.workOrderHr ?? [];
      const updated = existing.filter(
        (wo) => !(wo.period === period && wo.workOrderHr === workOrderId),
      );
      await dispatch(
        updateEmployee({
          id: removeTarget.id,
          data: { workOrderHr: updated },
        }),
      ).unwrap();

      const monthlyRecord = attendances.find(
        (a) =>
          a.employee === removeTarget.id &&
          a.year === year &&
          a.month === month,
      ) ?? null;
      const plan = buildRemoveEmployeeAttendancePlan({
        monthlyRecord,
        workOrderId,
        year,
        month,
      });
      if (plan.action === "delete") {
        await dispatch(deleteAttendance(plan.id)).unwrap();
      } else if (plan.action === "update") {
        await dispatch(
          updateAttendance({ id: plan.id, data: plan.data }),
        ).unwrap();
      }

      const wagesRecords = wages.filter(
        (w) =>
          w.employee === removeTarget.id &&
          w.year === year &&
          w.month === month &&
          w.workOrderHr === workOrderId,
      );
      await Promise.all(
        wagesRecords.map((w) => dispatch(deleteWages(w.id)).unwrap()),
      );

      toast.success(
        `${removeTarget.name || removeTarget.code} removed from this work order.`,
      );
      setRemoveOpen(false);
      setRemoveTarget(null);
      dispatch(fetchEmployees());
      dispatch(fetchAttendanceByFilter({ year, month }));
      dispatch(fetchWagesByFilter({ year, month }));
    } catch (err) {
      console.error("Failed to remove employee from work order", err);
      toast.error("Failed to remove employee from this work order.");
    } finally {
      setRemoving(false);
    }
  }, [
    dispatch,
    removeTarget,
    workOrderId,
    period,
    attendances,
    wages,
    year,
    month,
  ]);

  return {
    // Add
    addOpen,
    openAdd: useCallback(() => setAddOpen(true), []),
    closeAdd: useCallback(() => setAddOpen(false), []),
    setAddOpen,
    addEmployees,

    // Remove
    removeOpen,
    removeTarget,
    removing,
    requestRemove,
    cancelRemove,
    confirmRemove,
  };
}
