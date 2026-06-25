import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import {
  createAttendanceBulkConfig,
  createWagesBulkConfig,
} from '@/lib/excel/bulkUpload/transactionBulkConfigs';
import { AddEmployeeModal } from './AddEmployeeModal';
import { CLMAttendanceSheet } from './CLMAttendanceSheet';
import { CLMEmployeeTable } from './CLMEmployeeTable';
import type { CLMEmployeeRow } from './CLMEmployeeTable';
import { CLMFormXVI } from './CLMFormXVI';
import { CLMWagesSheet } from './CLMWagesSheet';
import { CLMYearMonthWorkOrder } from './CLMYearMonthWorkOrder';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { PaymentModal } from './PaymentModal';
import { useClmData } from '@/hooks/useClmData';
import { useClmEmployeeActions } from '@/hooks/useClmEmployeeActions';
import { useClmReports } from '@/hooks/useClmReports';
import { periodString } from '@/lib/clm/helpers';
import type { Employee } from '@/types';
import InfoStripe from '../shared/InfoStripe';

const NOW = new Date();

export function CLMPage() {
  // -------- Filter state (single source of truth for date + work order) -----
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [workOrderId, setWorkOrderId] = useState('');
  const [listShown, setListShown] = useState(false);
  const showList = useCallback(() => setListShown(true), []);

  // -------- FORM XVI / XVII inputs ------------------------------------------
  const [formXVILocation, setFormXVILocation] = useState('');
  const [formXVIEmployer, setFormXVIEmployer] = useState('');
  const [formXVIWorkOrderId, setFormXVIWorkOrderId] = useState('');

  const period = periodString(month, year);

  // -------- Data (master fetch + derived rows) ------------------------------
  const {
    workOrders,
    employees,
    designations,
    availableToAdd,
    tableRows,
    attendanceRecordForEmployee,
    existingWagesForEmployee,
    existingWagesListForEmployee,
  } = useClmData({ year, month, workOrderId, period, listShown });

  const attendanceBulkConfig = useMemo(() => createAttendanceBulkConfig(), []);
  const wagesBulkConfig = useMemo(() => createWagesBulkConfig(), []);

  // -------- Reports + show-list seeding -------------------------------------
  const reports = useClmReports({
    year,
    month,
    workOrderId,
    formXVIWorkOrderId,
    formXVILocation,
    formXVIEmployer,
    onListShown: showList,
    attendanceRecordForEmployee,
  });

  // -------- Add / Remove employee flows -------------------------------------
  const actions = useClmEmployeeActions({
    year,
    month,
    workOrderId,
    period,
    onListShown: showList,
  });

  // -------- Lightweight modal / sheet open state ----------------------------
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [attendance, setAttendance] = useState<{
    open: boolean;
    employeeId: string | null;
    employeeName: string;
  }>({ open: false, employeeId: null, employeeName: '' });

  const [wagesSheet, setWagesSheet] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({ open: false, employee: null });

  const [payment, setPayment] = useState<{
    open: boolean;
    employee: Employee | null;
  }>({ open: false, employee: null });

  // -------- Click handlers (simple setters) ---------------------------------
  const openEmployeeDetail = useCallback((code: string) => {
    setDetailCode(code);
    setDetailOpen(true);
  }, []);

  const openAttendance = useCallback(
    (employeeId: string, employeeName: string) => {
      setAttendance({ open: true, employeeId, employeeName });
    },
    [],
  );

  const openWages = useCallback(
    (row: CLMEmployeeRow) => {
      if (!reports.ensureWagesReady(row.employee)) return;
      setWagesSheet({ open: true, employee: row.employee });
    },
    [reports],
  );

  const openPayment = useCallback((employee: Employee) => {
    setPayment({ open: true, employee });
  }, []);

  // -------- Dialog labels ---------------------------------------------------
  const periodLabel = useMemo(() => {
    const m = new Date(year, month - 1, 1).toLocaleString('default', {
      month: 'long',
    });
    return `${m} ${year}`;
  }, [year, month]);

  const workOrderLabel = useMemo(
    () =>
      workOrders.find((w) => w.id === workOrderId)?.workOrderNumber ??
      'Work order',
    [workOrders, workOrderId],
  );

  const newPfApplicable = useMemo(
    () =>
      workOrderId
        ? (workOrders.find((wo) => wo.id === workOrderId)?.newPfApplicable ??
          false)
        : false,
    [workOrders, workOrderId],
  );

  // -------- Render ----------------------------------------------------------
  return (
    <div className='space-y-6'>
      <div className='border-b border-border pb-1 mb-1 flex flex-wrap items-center justify-between gap-4'>
        <h1 className='text-2xl font-bold text-primary'>CLM</h1>
        <div className='flex flex-wrap gap-2'>
          <BulkUploadDialog
            config={attendanceBulkConfig}
            context={{ employees, workOrders }}
            onSuccess={reports.refreshAttendanceAndWages}
            buttonText='Bulk Upload Attendance'
          />
          <BulkUploadDialog
            config={wagesBulkConfig}
            context={{ employees, designations, workOrders }}
            onSuccess={reports.refreshAttendanceAndWages}
            buttonText='Bulk Upload Wages'
          />
        </div>
      </div>

      <InfoStripe
        text='Select Year, Month and Work Order; then use Show List to view employees and manage attendance.'
        className='my-4 '
      />
      <CLMYearMonthWorkOrder
        year={year}
        month={month}
        workOrderId={workOrderId}
        workOrders={workOrders}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onWorkOrderChange={setWorkOrderId}
        onShowList={reports.handleShowList}
        onAllowancesSlip={reports.handleAllowancesSlip}
        onAllowancesSlipExcel={reports.handleAllowancesSlipExcel}
        onGenerateWagesRegister={reports.handleGenerateWagesRegister}
        onGenerateWagesRegisterExcel={reports.handleGenerateWagesRegisterExcel}
      />

      <CLMFormXVI
        location={formXVILocation}
        employer={formXVIEmployer}
        workOrderId={formXVIWorkOrderId}
        workOrders={workOrders}
        onLocationChange={setFormXVILocation}
        onEmployerChange={setFormXVIEmployer}
        onWorkOrderChange={setFormXVIWorkOrderId}
        onGenerateFormXVI={reports.handleGenerateFormXVI}
        onGenerateFormXVIExcel={reports.handleGenerateFormXVIExcel}
        onGenerateForm17={reports.handleGenerateForm17}
        onGenerateForm17Excel={reports.handleGenerateForm17Excel}
      />

      <div className='flex flex-wrap items-center justify-between gap-4'>
        <h2 className='text-lg font-semibold'>Employees</h2>
        <Button
          onClick={actions.openAdd}
          disabled={!workOrderId}
          variant='outline'
          className='border-primary text-primary hover:bg-primary/10'
        >
          Add employee
        </Button>
      </div>
      {!workOrderId && (
        <p className='text-sm text-muted-foreground'>
          Select a work order above to add employees to this period.
        </p>
      )}

      <CLMEmployeeTable
        rows={tableRows}
        canRemove={Boolean(workOrderId)}
        onEmployeeCodeClick={openEmployeeDetail}
        onAttendanceClick={openAttendance}
        onWagesClick={openWages}
        onPaymentShow={openPayment}
        onGenerateWagesPaySlip={reports.handleGenerateWagesPaySlip}
        onGenerateWagesPaySlipExcel={reports.handleGenerateWagesPaySlipExcel}
        onRemoveEmployee={actions.requestRemove}
      />

      <div className='flex justify-center'>
        <Button
          onClick={reports.refreshAttendanceAndWages}
          className='bg-primary text-primary-foreground hover:bg-primary/90 px-8'
        >
          Refresh Attendance & Wages
        </Button>
      </div>

      <EmployeeDetailModal
        employeeCode={detailCode}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <CLMAttendanceSheet
        open={attendance.open}
        onOpenChange={(open) => setAttendance((s) => ({ ...s, open }))}
        employeeId={attendance.employeeId}
        employeeName={attendance.employeeName}
        year={year}
        month={month}
        workOrderId={workOrderId || null}
        onSaved={reports.refetchAttendance}
      />

      <AddEmployeeModal
        open={actions.addOpen}
        onOpenChange={actions.setAddOpen}
        availableEmployees={availableToAdd}
        periodLabel={periodLabel}
        workOrderLabel={workOrderLabel}
        onAdd={actions.addEmployees}
      />

      <CLMWagesSheet
        open={wagesSheet.open}
        onOpenChange={(open) => setWagesSheet((s) => ({ ...s, open }))}
        employee={wagesSheet.employee}
        year={year}
        month={month}
        workOrderId={workOrderId || null}
        attendanceRecord={
          wagesSheet.employee
            ? attendanceRecordForEmployee(wagesSheet.employee)
            : null
        }
        existingWages={
          wagesSheet.employee
            ? existingWagesForEmployee(wagesSheet.employee)
            : null
        }
        newPfApplicable={newPfApplicable}
        onSaved={reports.refetchWages}
      />

      <PaymentModal
        open={payment.open}
        onOpenChange={(open) => setPayment((s) => ({ ...s, open }))}
        employee={payment.employee}
        attendanceRecord={
          payment.employee
            ? attendanceRecordForEmployee(payment.employee)
            : null
        }
        wagesRecord={
          payment.employee ? existingWagesForEmployee(payment.employee) : null
        }
        wagesList={
          payment.employee ? existingWagesListForEmployee(payment.employee) : []
        }
        workOrderId={workOrderId || null}
        newPfApplicable={newPfApplicable}
      />

      <DeleteDialog
        open={actions.removeOpen}
        onClose={actions.cancelRemove}
        onConfirm={actions.confirmRemove}
        title='Remove employee from work order?'
        description={
          actions.removeTarget
            ? `This will remove ${actions.removeTarget.name || actions.removeTarget.code} from ${workOrderLabel} for ${periodLabel} and permanently delete their attendance and wages for this period. This action cannot be undone.`
            : 'This will remove the employee from this work order and permanently delete their attendance and wages for this period. This action cannot be undone.'
        }
        loading={actions.removing}
      />
    </div>
  );
}
