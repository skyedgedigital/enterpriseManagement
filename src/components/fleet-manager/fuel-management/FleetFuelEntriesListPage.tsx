import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, Droplets, IndianRupee, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import type { FuelEntry } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createFuelEntryBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { fuelEntryExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';
import {
  clearFuelEntries,
  deleteFuelEntry,
  fetchAllFuelEntries,
  fetchFuelEntries,
} from '@/store/slices/fleet-manager/fuelManagementSlice';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

const YEARS = Array.from({ length: 7 }, (_, i) => String(2024 + i));

const formatDate = (ts: Timestamp): string =>
  ts.toDate().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function FuelEntriesListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { entries, loading } = useAppSelector((state) => state.fuelEntries);
  const { items: vehicles } = useAppSelector((state) => state.vehicles);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<FuelEntry | null>(null);
  const fuelEntryBulkConfig = useMemo(() => createFuelEntryBulkConfig(), []);

  const isFilterActive =
    selectedMonth !== '' || selectedYear !== '' || selectedVehicleId !== '';

  // Mount: load all entries + vehicles
  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchAllFuelEntries({ vehicleId: undefined }));
    return () => {
      dispatch(clearFuelEntries());
    };
  }, [dispatch]);

  const handleApplyFilter = () => {
    // If month or year is set, both must be present
    if (
      (selectedMonth !== '' && selectedYear === '') ||
      (selectedMonth === '' && selectedYear !== '')
    ) {
      toast.error('Please select both month and year');
      return;
    }

    if (selectedMonth !== '' && selectedYear !== '') {
      // Date range filter (with optional vehicle)
      dispatch(
        fetchFuelEntries({
          year: Number(selectedYear),
          month: Number(selectedMonth),
          vehicleId: selectedVehicleId || undefined,
        }),
      );
    } else if (selectedVehicleId !== '') {
      // Only vehicle filter
      dispatch(fetchAllFuelEntries({ vehicleId: selectedVehicleId }));
    }
  };

  const handleClearFilter = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedVehicleId('');
    dispatch(fetchAllFuelEntries({ vehicleId: undefined }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteFuelEntry(deleteTarget.id));
    if (deleteFuelEntry.fulfilled.match(result)) {
      toast.success('Entry deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  // Totals
  const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);
  const totalLitres = entries.reduce((sum, e) => sum + e.fuelQuantity, 0);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Fuel Entries'
        description='Track vehicle fuel fill-ups'
        action={
          <div className="flex gap-2">
            <ExportExcelButton
              config={fuelEntryExportConfig}
              items={entries}
              context={{ vehicles }}
            />
            <BulkUploadDialog
              config={fuelEntryBulkConfig}
              context={{ vehicles }}
              onSuccess={() =>
                dispatch(fetchAllFuelEntries({ vehicleId: undefined }))
              }
            />
            <Button
              onClick={() =>
                navigate('/fleet-manager/fuel-management/entries/new')
              }
            >
              <Plus className='h-4 w-4' />
              Add Entry
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className='pt-5'>
          <div className='grid gap-3 sm:grid-cols-4'>
            {/* Month */}
            <div className='space-y-1.5'>
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder='All months' />
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

            {/* Year */}
            <div className='space-y-1.5'>
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder='All years' />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle */}
            <div className='space-y-1.5'>
              <Label>Vehicle</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All vehicles' />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
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
                onClick={handleApplyFilter}
                disabled={loading || !isFilterActive}
              >
                Apply Filter
              </Button>
              {isFilterActive && (
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleClearFilter}
                  disabled={loading}
                  title='Clear all filters'
                >
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
          </div>

          {/* Active filter badges */}
          {isFilterActive && (
            <div className='mt-3 flex flex-wrap items-center gap-2'>
              <span className='text-xs text-muted-foreground'>
                Filtered by:
              </span>
              {selectedMonth !== '' && (
                <Badge variant='secondary'>
                  {MONTHS.find((m) => String(m.value) === selectedMonth)?.label}
                </Badge>
              )}
              {selectedYear !== '' && (
                <Badge variant='secondary'>{selectedYear}</Badge>
              )}
              {selectedVehicleId !== '' && (
                <Badge variant='secondary'>
                  {vehicles.find((v) => v.id === selectedVehicleId)
                    ?.vehicleNumber ?? selectedVehicleId}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Results */}
      {!loading && (
        <>
          {entries.length === 0 ? (
            <EmptyState
              title='No entries found'
              description={
                isFilterActive
                  ? 'No fuel entries match the selected filters.'
                  : 'No fuel entries yet. Add your first entry.'
              }
              action={
                isFilterActive ? (
                  <Button variant='outline' onClick={handleClearFilter}>
                    <X className='h-4 w-4' />
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      navigate('/fleet-manager/fuel-management/entries/new')
                    }
                  >
                    <Plus className='h-4 w-4' />
                    Add Entry
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Summary stats */}
              <div className='grid grid-cols-3 gap-3'>
                <Card className='border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
                  <CardContent className='p-4'>
                    <p className='text-xs text-muted-foreground'>
                      Total Entries
                    </p>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      {entries.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <Droplets className='h-3 w-3' />
                      Total Litres
                    </div>
                    <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
                      {totalLitres.toFixed(2)} L
                    </p>
                  </CardContent>
                </Card>
                <Card className='border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <IndianRupee className='h-3 w-3' />
                      Total Amount
                    </div>
                    <p className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
                      ₹
                      {totalAmount.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
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
                        Date
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Vehicle
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Fuel Type
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Qty (L)
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Meter Reading
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Amount (₹)
                      </th>
                      <th className='px-4 py-3 text-right font-medium text-muted-foreground'>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {entries.map((entry) => (
                      <tr key={entry.id} className='hover:bg-muted/30'>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {formatDate(entry.date)}
                        </td>
                        <td className='px-4 py-3 font-medium'>
                          {entry.vehicleNumber}
                        </td>
                        <td className='px-4 py-3'>
                          <Badge
                            variant='outline'
                            className={
                              entry.fuelType === 'petrol'
                                ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                                : 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                            }
                          >
                            {entry.fuelType.charAt(0).toUpperCase() +
                              entry.fuelType.slice(1)}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>
                          {entry.fuelQuantity.toFixed(3)}
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {entry.meterReading}
                        </td>
                        <td className='px-4 py-3 font-medium'>
                          ₹
                          {entry.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className='px-4 py-3 text-right'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            onClick={() => setDeleteTarget(entry)}
                          >
                            <Trash2 className='h-4 w-4 text-destructive' />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className='border-t bg-muted/50'>
                    <tr>
                      <td
                        colSpan={3}
                        className='px-4 py-3 font-medium text-muted-foreground'
                      >
                        Total ({entries.length} entries)
                      </td>
                      <td className='px-4 py-3 font-semibold'>
                        {totalLitres.toFixed(3)} L
                      </td>
                      <td />
                      <td className='px-4 py-3 font-semibold'>
                        ₹
                        {totalAmount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </>
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
