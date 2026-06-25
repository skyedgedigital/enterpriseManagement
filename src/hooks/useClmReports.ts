import { useCallback } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchAttendanceByFilter,
} from "@/store/slices/attendanceSlice";
import {
  fetchWagesByFilter,
  addWages,
} from "@/store/slices/wagesSlice";
import {
  buildWagesPaySlipData,
  generateWagesPaySlip,
} from "@/lib/generateWagesPaySlip";
import { buildFormXVIData, generateFormXVI } from "@/lib/generateFormXVI";
import {
  buildWagesRegisterData,
  generateWagesRegister,
} from "@/lib/generateWagesRegister";
import { buildForm17Data, generateForm17 } from "@/lib/generateForm17";
import {
  buildAllowanceSlipData,
  generateAllowanceSlip,
} from "@/lib/generateAllowanceSlip";
import { generateWagesPaySlipExcel } from "@/lib/excel/generateWagesPaySlipExcel";
import { generateFormXVIExcel } from "@/lib/excel/generateFormXVIExcel";
import { generateWagesRegisterExcel } from "@/lib/excel/generateWagesRegisterExcel";
import { generateForm17Excel } from "@/lib/excel/generateForm17Excel";
import { generateAllowanceSlipExcel } from "@/lib/excel/generateAllowanceSlipExcel";
import { getAttendanceSliceForWorkOrder } from "@/lib/attendanceSlice";
import {
  DEFAULT_WORKING_DAYS,
  computeMissingWagesPairs,
  periodString,
  runReport,
} from "@/lib/clm/helpers";
import type { Attendance, Employee } from "@/types";

export interface UseClmReportsOptions {
  year: number;
  month: number;
  workOrderId: string;
  formXVIWorkOrderId: string;
  formXVILocation: string;
  formXVIEmployer: string;
  onListShown: () => void;
  attendanceRecordForEmployee: (employee: Employee) => Attendance | null;
}

/**
 * All report-generation and data-refresh handlers for the CLM page.
 *
 * Each handler wraps its work in `runReport` so they all share the same
 * validate / try-catch / toast pattern. Data is read directly from Redux so
 * callers only need to supply the active filter context.
 */
export function useClmReports({
  year,
  month,
  workOrderId,
  formXVIWorkOrderId,
  formXVILocation,
  formXVIEmployer,
  onListShown,
  attendanceRecordForEmployee,
}: UseClmReportsOptions) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.employees.items);
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const attendances = useAppSelector((s) => s.attendances.items);
  const wages = useAppSelector((s) => s.wages.items);
  const designations = useAppSelector((s) => s.designations.items);

  // ------------------------------------------------------------------------
  // Show List: fetch for the period + seed missing wages rows (per WO).
  // ------------------------------------------------------------------------
  const handleShowList = useCallback(async () => {
    dispatch(fetchAttendanceByFilter({ year, month }));
    const existingWages = await dispatch(
      fetchWagesByFilter({ year, month }),
    ).unwrap();
    onListShown();

    const missing = computeMissingWagesPairs({
      employees,
      existingWages,
      workOrderId,
      period: periodString(month, year),
    });
    if (missing.length === 0) return;

    await Promise.all(
      missing.map(({ employee, workOrderHr }) => {
        const desig = employee.designation
          ? designations.find((d) => d.id === employee.designation)
          : null;
        const basic = desig ? Number(desig.basic) || 0 : 0;
        const da = desig ? Number(desig.da) || 0 : 0;
        const total = basic + da;
        return dispatch(
          addWages({
            employee: employee.id,
            designation: employee.designation || "",
            month,
            year,
            workOrderHr,
            totalWorkingDays: DEFAULT_WORKING_DAYS,
            attendance: 0,
            basic,
            da,
            payRate: total,
            allowances: 0,
            otherCash: 0,
            total,
            incentiveApplicable: false,
            incentiveDays: 0,
            incentiveAmount: 0,
            otherDeduction: 0,
            advanceDeduction: 0,
            damageDeduction: 0,
            isAdvanceDeduction: false,
            isDamageDeduction: false,
            netAmountPaid: total,
          }),
        );
      }),
    );
    dispatch(fetchWagesByFilter({ year, month }));
  }, [
    dispatch,
    year,
    month,
    workOrderId,
    employees,
    designations,
    onListShown,
  ]);

  // ------------------------------------------------------------------------
  // Period-wide report helpers (shared validators).
  // ------------------------------------------------------------------------
  const validateWagesPresent = useCallback(
    (byWorkOrder?: string): string | null => {
      const exists = wages.some(
        (w) =>
          w.year === year &&
          w.month === month &&
          (!byWorkOrder || w.workOrderHr === byWorkOrder),
      );
      if (!exists) {
        return byWorkOrder
          ? "No wages records found for selected work order and period."
          : "No wages records found for selected month/year.";
      }
      return null;
    },
    [wages, year, month],
  );

  const requireFormXVIWorkOrder = useCallback(
    (label: string) => (): string | null =>
      formXVIWorkOrderId ? null : `Please select a work order for ${label}.`,
    [formXVIWorkOrderId],
  );

  // ------------------------------------------------------------------------
  // Concrete handlers.
  // ------------------------------------------------------------------------
  const handleAllowancesSlip = useCallback(
    () =>
      runReport({
        label: "Allowance Slip",
        validate: () => {
          const any = wages.some(
            (w) =>
              w.year === year &&
              w.month === month &&
              (!workOrderId || w.workOrderHr === workOrderId),
          );
          return any ? null : "No wages records found for selected filters.";
        },
        run: () =>
          generateAllowanceSlip({
            employees,
            wages,
            attendances,
            workOrders,
            month,
            year,
            workOrderId: workOrderId || undefined,
          }),
      }),
    [employees, wages, attendances, workOrders, month, year, workOrderId],
  );

  const handleAllowancesSlipExcel = useCallback(
    () =>
      runReport({
        label: "Allowance Slip Excel",
        validate: () => {
          const any = wages.some(
            (w) =>
              w.year === year &&
              w.month === month &&
              (!workOrderId || w.workOrderHr === workOrderId),
          );
          return any ? null : "No wages records found for selected filters.";
        },
        run: () =>
          generateAllowanceSlipExcel(
            buildAllowanceSlipData({
              employees,
              wages,
              attendances,
              workOrders,
              month,
              year,
              workOrderId: workOrderId || undefined,
            }),
          ),
        successMessage: "Allowance Slip Excel generated.",
      }),
    [employees, wages, attendances, workOrders, month, year, workOrderId],
  );

  const handleGenerateWagesRegister = useCallback(
    () =>
      runReport({
        label: "Wages Register",
        validate: () => validateWagesPresent(),
        run: () =>
          generateWagesRegister({
            employees,
            wages,
            attendances,
            workOrders,
            designations,
            month,
            year,
          }),
      }),
    [
      employees,
      wages,
      attendances,
      workOrders,
      designations,
      month,
      year,
      validateWagesPresent,
    ],
  );

  const handleGenerateWagesRegisterExcel = useCallback(
    () =>
      runReport({
        label: "Wages Register Excel",
        validate: () => validateWagesPresent(),
        run: async () => {
          const slips = buildWagesRegisterData({
            employees,
            wages,
            attendances,
            workOrders,
            designations,
            month,
            year,
          });
          await generateWagesRegisterExcel(slips, month, year);
        },
        successMessage: "Wages Register Excel generated.",
      }),
    [
      employees,
      wages,
      attendances,
      workOrders,
      designations,
      month,
      year,
      validateWagesPresent,
    ],
  );

  const handleGenerateForm17 = useCallback(
    () =>
      runReport({
        label: "FORM XVII",
        validate: () =>
          requireFormXVIWorkOrder("FORM XVII")() ??
          validateWagesPresent(formXVIWorkOrderId),
        run: () =>
          generateForm17({
            employees,
            wages,
            attendances,
            workOrders,
            designations,
            month,
            year,
            workOrderId: formXVIWorkOrderId,
            location: formXVILocation,
            employer: formXVIEmployer,
          }),
        successMessage: "FORM XVII generated.",
      }),
    [
      employees,
      wages,
      attendances,
      workOrders,
      designations,
      month,
      year,
      formXVIWorkOrderId,
      formXVILocation,
      formXVIEmployer,
      requireFormXVIWorkOrder,
      validateWagesPresent,
    ],
  );

  const handleGenerateForm17Excel = useCallback(
    () =>
      runReport({
        label: "FORM XVII Excel",
        validate: () =>
          requireFormXVIWorkOrder("FORM XVII")() ??
          validateWagesPresent(formXVIWorkOrderId),
        run: () =>
          generateForm17Excel(
            buildForm17Data({
              employees,
              wages,
              attendances,
              workOrders,
              designations,
              month,
              year,
              workOrderId: formXVIWorkOrderId,
              location: formXVILocation,
              employer: formXVIEmployer,
            }),
          ),
        successMessage: "FORM XVII Excel generated.",
      }),
    [
      employees,
      wages,
      attendances,
      workOrders,
      designations,
      month,
      year,
      formXVIWorkOrderId,
      formXVILocation,
      formXVIEmployer,
      requireFormXVIWorkOrder,
      validateWagesPresent,
    ],
  );

  const handleGenerateFormXVI = useCallback(
    () =>
      runReport({
        label: "FORM XVI",
        validate: requireFormXVIWorkOrder("FORM XVI"),
        run: () =>
          generateFormXVI({
            employees,
            attendances,
            workOrderId: formXVIWorkOrderId,
            location: formXVILocation,
            employer: formXVIEmployer,
            month,
            year,
          }),
      }),
    [
      employees,
      attendances,
      formXVIWorkOrderId,
      formXVILocation,
      formXVIEmployer,
      month,
      year,
      requireFormXVIWorkOrder,
    ],
  );

  const handleGenerateFormXVIExcel = useCallback(
    () =>
      runReport({
        label: "FORM XVI Excel",
        validate: requireFormXVIWorkOrder("FORM XVI"),
        run: () =>
          generateFormXVIExcel(
            buildFormXVIData({
              employees,
              attendances,
              workOrderId: formXVIWorkOrderId,
              location: formXVILocation,
              employer: formXVIEmployer,
              month,
              year,
            }),
          ),
        successMessage: "FORM XVI Excel generated.",
      }),
    [
      employees,
      attendances,
      formXVIWorkOrderId,
      formXVILocation,
      formXVIEmployer,
      month,
      year,
      requireFormXVIWorkOrder,
    ],
  );

  // ------------------------------------------------------------------------
  // Per-employee wages payslip handlers.
  // ------------------------------------------------------------------------
  const buildWagesPaySlipInputs = useCallback(
    (employee: Employee) => {
      const wagesRecord = wages.find(
        (w) => w.employee === employee.id && w.year === year && w.month === month,
      );
      if (!wagesRecord) return null;
      const workOrder = workOrderId
        ? workOrders.find((wo) => wo.id === workOrderId) ?? null
        : null;
      return {
        employee,
        wages: wagesRecord,
        attendance: attendanceRecordForEmployee(employee),
        workOrder,
        designations,
        month,
        year,
        newPfApplicable: workOrder?.newPfApplicable ?? false,
      };
    },
    [
      wages,
      workOrders,
      designations,
      workOrderId,
      month,
      year,
      attendanceRecordForEmployee,
    ],
  );

  const handleGenerateWagesPaySlip = useCallback(
    (employee: Employee) =>
      runReport({
        label: "Wages Pay Slip",
        run: async () => {
          const input = buildWagesPaySlipInputs(employee);
          if (!input) {
            toast.error("Wages not filled for this employee.");
            return;
          }
          await generateWagesPaySlip(input);
        },
      }),
    [buildWagesPaySlipInputs],
  );

  const handleGenerateWagesPaySlipExcel = useCallback(
    (employee: Employee) =>
      runReport({
        label: "Wages Pay Slip Excel",
        run: async () => {
          const input = buildWagesPaySlipInputs(employee);
          if (!input) {
            toast.error("Wages not filled for this employee.");
            return;
          }
          await generateWagesPaySlipExcel(buildWagesPaySlipData(input));
        },
        successMessage: "Wages Pay Slip Excel generated.",
      }),
    [buildWagesPaySlipInputs],
  );

  // ------------------------------------------------------------------------
  // Wages-click guard: ensure attendance exists (and is tagged) before opening.
  // ------------------------------------------------------------------------
  const ensureWagesReady = useCallback(
    (employee: Employee): boolean => {
      const fullAttendance = attendances.find(
        (a) =>
          a.employee === employee.id && a.year === year && a.month === month,
      );
      if (!fullAttendance?.days?.length) {
        toast.error("First fill the attendance and then proceed with wages.");
        return false;
      }
      if (workOrderId) {
        const slice = getAttendanceSliceForWorkOrder(fullAttendance, workOrderId);
        if (slice.days.length === 0) {
          toast.error(
            "No attendance days attributed to this work order yet. Fill the attendance sheet first.",
          );
          return false;
        }
      }
      return true;
    },
    [attendances, year, month, workOrderId],
  );

  // ------------------------------------------------------------------------
  // Refetch helpers.
  // ------------------------------------------------------------------------
  const refreshAttendanceAndWages = useCallback(() => {
    dispatch(fetchAttendanceByFilter({ year, month }));
    dispatch(fetchWagesByFilter({ year, month }));
    toast.success("Attendance & Wages data refreshed");
  }, [dispatch, year, month]);

  const refetchAttendance = useCallback(() => {
    dispatch(fetchAttendanceByFilter({ year, month }));
  }, [dispatch, year, month]);

  const refetchWages = useCallback(() => {
    dispatch(fetchWagesByFilter({ year, month }));
  }, [dispatch, year, month]);

  return {
    handleShowList,
    handleAllowancesSlip,
    handleAllowancesSlipExcel,
    handleGenerateWagesRegister,
    handleGenerateWagesRegisterExcel,
    handleGenerateForm17,
    handleGenerateForm17Excel,
    handleGenerateFormXVI,
    handleGenerateFormXVIExcel,
    handleGenerateWagesPaySlip,
    handleGenerateWagesPaySlipExcel,
    ensureWagesReady,
    refreshAttendanceAndWages,
    refetchAttendance,
    refetchWages,
  };
}
