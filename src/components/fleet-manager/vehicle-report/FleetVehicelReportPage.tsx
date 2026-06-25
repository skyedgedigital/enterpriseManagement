import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Search, X, FileSpreadsheet } from 'lucide-react';
import { parse, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Timestamp } from 'firebase/firestore';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import {
  fetchVehicleReport,
  clearVehicleReport,
} from '@/store/slices/fleet-manager/vehicleReportSlice';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { computeReportTotals } from '@/services/fleet-manger/vehicleReport.service';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';
import { fetchEngineers } from '@/store/slices/admin/adminEngineerSlice';
import type { VehicleReportRow } from '@/types';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const fmtDate = (ts: Timestamp): string =>
  ts.toDate().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fmtAmt = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

// yyyy-MM-dd → Date
const parseYMD = (s: string) => parse(s, 'yyyy-MM-dd', new Date());

// ----------------------------------------------------------------
// Excel export
// ----------------------------------------------------------------
function exportToExcel(
  rows: VehicleReportRow[],
  startLabel: string,
  endLabel: string,
  deptMap: Record<string, string>,
  engMap: Record<string, string>,
  vehiclesMap: Record<string, { vehicleNumber: string; vehicleType: string }>,
) {
  const title = `Vehicle Report: ${startLabel} to ${endLabel}`;
  const totals = computeReportTotals(rows);

  const data = rows.map((r) => ({
    'Chalan Number': r.chalanNumber,
    Date: fmtDate(r.date),
    'Vehicle / Equipment': vehiclesMap[r.vehicleNumber]?.vehicleType || '—',
    'Registration Number': r.vehicleNumber,
    Location: r.location,
    Department: deptMap[r.departmentId] ?? r.departmentId,
    'Officer Name': engMap[r.engineerId] ?? r.engineerId,
    'Running Hours': r.runningHours,
    Unit: r.unit,
    'Amount (₹)': r.amount,
    'GST 18% (₹)': r.gst,
    'Total (₹)': r.total,
  }));

  // Total row
  data.push({
    'Chalan Number': '',
    Date: '',
    'Vehicle / Equipment': '',
    'Registration Number': '',
    Location: '',
    Department: '',
    'Officer Name': '',
    'Running Hours': 'TOTAL',
    Unit: '',
    'Amount (₹)': totals.totalAmount,
    'GST 18% (₹)': totals.totalGst,
    'Total (₹)': totals.grandTotal,
  } as any);

  const titleRows: any[][] = [[title], []];
  const body = XLSX.utils.sheet_to_json<any[]>(XLSX.utils.json_to_sheet(data), {
    header: 1,
  });
  const ws = XLSX.utils.aoa_to_sheet([...titleRows, ...body] as any[][]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Report');
  XLSX.writeFile(wb, `vehicle_report_${startLabel}_to_${endLabel}.xlsx`);
  toast.success('Exported successfully');
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function FleetVehicleReportPage() {
  const dispatch = useAppDispatch();

  const { reportRows: rows, loading } = useAppSelector(
    (state) => state.vehicleReports,
  );

  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const vehiclesMap: Record<
    string,
    { vehicleNumber: string; vehicleType: string }
  > = Object.fromEntries(
    vehicles.map((v) => [
      v.vehicleNumber,
      { vehicleNumber: v.vehicleNumber, vehicleType: v.vehicleType ?? '-' },
    ]),
  );

  const { items: departments } = useAppSelector(
    (state) => state.adminDepartments,
  );

  const { engineers } = useAppSelector((state) => state.engineers);
  const deptMap: Record<string, string> = Object.fromEntries(
    departments.map((d: any) => [d.id, d.name]),
  );

  const engMap: Record<string, string> = Object.fromEntries(
    engineers.map((e: any) => [e.id, e.name]),
  );

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchAdminDepartments());
    dispatch(fetchEngineers());

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    dispatch(
      fetchVehicleReport({
        startDate: firstDayOfMonth,
        endDate: today,
        vehicleNumber: vehicleNumber || undefined,
      }),
    );
    return () => {
      dispatch(clearVehicleReport());
    };
  }, [dispatch]);

  const handleSearch = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end date');
      return;
    }
    const start = parseYMD(startDate);
    const end = parseYMD(endDate);
    if (start > end) {
      toast.error('Start date cannot be after end date');
      return;
    }
    dispatch(
      fetchVehicleReport({
        startDate: start,
        endDate: end,
        vehicleNumber: vehicleNumber || undefined,
      }),
    );
    setHasFetched(true);
  };

  const handleClearVehicle = () => {
    setVehicleNumber('');
    if (hasFetched && startDate && endDate) {
      dispatch(
        fetchVehicleReport({
          startDate: parseYMD(startDate),
          endDate: parseYMD(endDate),
        }),
      );
    }
  };

  const totals = computeReportTotals(rows);

  const startLabel = startDate ? format(parseYMD(startDate), 'dd-MM-yyyy') : '';
  const endLabel = endDate ? format(parseYMD(endDate), 'dd-MM-yyyy') : '';

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Vehicle Report'
        description='View chalan data by date range and vehicle'
        action={
          hasFetched && rows.length > 0 ? (
            <Button
              variant='excel'
              onClick={() =>
                exportToExcel(
                  rows,
                  startLabel,
                  endLabel,
                  deptMap,
                  engMap,
                  vehiclesMap,
                )
              }
            >
              <FileSpreadsheet className='h-4 w-4' />
              Export to Excel
            </Button>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className='pt-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {/* Start Date */}
            <div className='space-y-1.5'>
              <Label>Start Date *</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder='Select start date'
                fromYear={2020}
                toYear={2035}
              />
            </div>

            {/* End Date */}
            <div className='space-y-1.5'>
              <Label>End Date *</Label>
              <DatePicker
                value={endDate}
                onChange={setEndDate}
                placeholder='Select end date'
                fromYear={2020}
                toYear={2035}
              />
            </div>

            {/* Vehicle (optional) */}
            <div className='space-y-1.5'>
              <Label>Vehicle (optional)</Label>
              <Select value={vehicleNumber} onValueChange={setVehicleNumber}>
                <SelectTrigger>
                  <SelectValue placeholder='All vehicles' />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.vehicleNumber}>
                      {v.vehicleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buttons */}
            <div className='flex items-end gap-2'>
              <Button
                className='flex-1'
                onClick={handleSearch}
                disabled={loading || !startDate || !endDate}
              >
                <Search className='h-4 w-4' />
                {loading ? 'Loading...' : 'View Report'}
              </Button>
              {vehicleNumber && (
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleClearVehicle}
                  disabled={loading}
                  title='Clear vehicle filter'
                >
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges */}
          {hasFetched && (startDate || vehicleNumber) && (
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <span className='text-xs text-muted-foreground'>Showing:</span>
              {startDate && endDate && (
                <Badge variant='secondary'>
                  {startLabel} → {endLabel}
                </Badge>
              )}
              {vehicleNumber && (
                <Badge variant='secondary'>{vehicleNumber}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Results */}
      {!loading && hasFetched && (
        <>
          {rows.length === 0 ? (
            <EmptyState
              title='No data found'
              description='No chalan entries found for the selected date range and filters.'
            />
          ) : (
            <>
              {/* Summary cards */}
              <div className='grid grid-cols-3 gap-3'>
                <Card className='border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
                  <CardContent className='p-4'>
                    <p className='text-xs text-muted-foreground'>
                      Total Entries
                    </p>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      {rows.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'>
                  <CardContent className='p-4'>
                    <p className='text-xs text-muted-foreground'>
                      Total Amount
                    </p>
                    <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                      {fmtAmt(totals.totalAmount)}
                    </p>
                  </CardContent>
                </Card>
                <Card className='border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'>
                  <CardContent className='p-4'>
                    <p className='text-xs text-muted-foreground'>
                      Grand Total (incl. GST)
                    </p>
                    <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                      {fmtAmt(totals.grandTotal)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Table */}
              <div className='overflow-x-auto rounded-lg border'>
                <table className='w-full text-sm'>
                  <thead className='border-b bg-muted/50'>
                    <tr>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Chalan No.
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Date
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Vehicle / Equipment
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Reg. Number
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Location
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Department
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Officer
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Hours
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Unit
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-muted-foreground'>
                        Amount (₹)
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-muted-foreground'>
                        GST 18%
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-muted-foreground'>
                        Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {rows.map((row, idx) => (
                      <tr
                        key={`${row.chalanId}-${idx}`}
                        className='hover:bg-muted/30'
                      >
                        <td className='px-4 py-3 font-medium'>
                          {row.chalanNumber}
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {fmtDate(row.date)}
                        </td>
                        <td className='px-4 py-3'>
                          {vehiclesMap[row.vehicleNumber]?.vehicleType || '—'}
                        </td>
                        <td className='px-4 py-3'>
                          <Badge variant='outline'>{row.vehicleNumber}</Badge>
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {row.location}
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {deptMap[row.departmentId] ?? row.departmentId}
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {engMap[row.engineerId] ?? row.engineerId}
                        </td>
                        <td className='px-4 py-3'>{row.runningHours}</td>
                        <td className='px-4 py-3 text-muted-foreground capitalize'>
                          {row.unit}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          {fmtAmt(row.amount)}
                        </td>
                        <td className='px-4 py-3 text-right text-muted-foreground'>
                          {fmtAmt(row.gst)}
                        </td>
                        <td className='px-4 py-3 text-right font-medium'>
                          {fmtAmt(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Totals footer */}
                  <tfoot className='border-t bg-muted/50'>
                    <tr>
                      <td
                        colSpan={9}
                        className='px-4 py-3 font-semibold text-muted-foreground'
                      >
                        Total ({rows.length} entries)
                      </td>
                      <td className='px-4 py-3 text-right font-semibold'>
                        {fmtAmt(totals.totalAmount)}
                      </td>
                      <td className='px-4 py-3 text-right font-semibold text-muted-foreground'>
                        {fmtAmt(totals.totalGst)}
                      </td>
                      <td className='px-4 py-3 text-right font-semibold'>
                        {fmtAmt(totals.grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
