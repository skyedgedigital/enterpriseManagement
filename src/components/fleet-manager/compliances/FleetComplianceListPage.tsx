// @/components/fleet-manager/compliance/ComplianceListPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2, X, IndianRupee } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import type { Compliance } from '@/types';
import { COMPLIANCE_TYPES } from '@/types';

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
import { createComplianceBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { complianceExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';
import {
  clearCompliances,
  deleteCompliance,
  fetchAllCompliances,
  fetchFilteredCompliances,
} from '@/store/slices/fleet-manager/compliancesSlice';

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

// Badge color per compliance type
const complianceBadgeClass = (type: string): string => {
  const map: Record<string, string> = {
    EMI: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
    INSURANCE:
      'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    TAX: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
    FITNESS:
      'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
    'LOAD TEST':
      'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
    SAFETY:
      'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
    PUC: 'border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
    OTHER:
      'border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[type] ?? 'border-gray-300 bg-gray-50 text-gray-700';
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function ComplianceListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { compliances, loading } = useAppSelector((state) => state.compliances);
  const { items: vehicles } = useAppSelector((state) => state.vehicles);

  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Compliance | null>(null);
  const complianceBulkConfig = useMemo(() => createComplianceBulkConfig(), []);

  const isFilterActive =
    selectedVehicleNumber !== '' ||
    selectedType !== '' ||
    selectedMonth !== '' ||
    selectedYear !== '';

  // Mount: load all + vehicles
  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchAllCompliances());
    return () => {
      dispatch(clearCompliances());
    };
  }, [dispatch]);

  const handleApplyFilter = () => {
    // month and year must come together
    if (
      (selectedMonth !== '' && selectedYear === '') ||
      (selectedMonth === '' && selectedYear !== '')
    ) {
      toast.error('Please select both month and year');
      return;
    }

    const filters: {
      vehicleNumber?: string;
      complianceType?: string;
      year?: number;
      month?: number;
    } = {};

    if (selectedVehicleNumber) filters.vehicleNumber = selectedVehicleNumber;
    if (selectedType) filters.complianceType = selectedType;
    if (selectedMonth !== '' && selectedYear !== '') {
      filters.year = Number(selectedYear);
      filters.month = Number(selectedMonth);
    }

    dispatch(fetchFilteredCompliances(filters));
  };

  const handleClearFilter = () => {
    setSelectedVehicleNumber('');
    setSelectedType('');
    setSelectedMonth('');
    setSelectedYear('');
    dispatch(fetchAllCompliances());
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteCompliance(deleteTarget.id));
    if (deleteCompliance.fulfilled.match(result)) {
      toast.success('Compliance deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const totalAmount = compliances.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Other Compliances'
        description='Track vehicle compliance expenses'
        action={
          <div className="flex gap-2">
            <ExportExcelButton
              config={complianceExportConfig}
              items={compliances}
              context={{ vehicles }}
            />
            <BulkUploadDialog
              config={complianceBulkConfig}
              context={{ vehicles }}
              onSuccess={() => dispatch(fetchAllCompliances())}
            />
            <Button onClick={() => navigate('/fleet-manager/compliance/new')}>
              <Plus className='h-4 w-4' />
              Add Entry
            </Button>
          </div>
        }
      />

      {/* Filter bar */}
      <Card>
        <CardContent className='pt-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
            {/* Vehicle */}
            <div className='space-y-1.5'>
              <Label>Vehicle</Label>
              <Select
                value={selectedVehicleNumber}
                onValueChange={setSelectedVehicleNumber}
              >
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

            {/* Compliance Type */}
            <div className='space-y-1.5'>
              <Label>Compliance Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  {COMPLIANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              {selectedVehicleNumber && (
                <Badge variant='secondary'>{selectedVehicleNumber}</Badge>
              )}
              {selectedType && (
                <Badge variant='secondary'>{selectedType}</Badge>
              )}
              {selectedMonth !== '' && (
                <Badge variant='secondary'>
                  {MONTHS.find((m) => String(m.value) === selectedMonth)?.label}
                </Badge>
              )}
              {selectedYear !== '' && (
                <Badge variant='secondary'>{selectedYear}</Badge>
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
          {compliances.length === 0 ? (
            <EmptyState
              title='No compliance entries found'
              description={
                isFilterActive
                  ? 'No entries match the selected filters.'
                  : 'No compliance entries yet. Add your first entry.'
              }
              action={
                isFilterActive ? (
                  <Button variant='outline' onClick={handleClearFilter}>
                    <X className='h-4 w-4' />
                    Clear Filters
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate('/fleet-manager/compliance/new')}
                  >
                    <Plus className='h-4 w-4' />
                    Add Entry
                  </Button>
                )
              }
            />
          ) : (
            <>
              {/* Summary */}
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                <Card className='border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
                  <CardContent className='p-4'>
                    <p className='text-xs text-muted-foreground'>
                      Total Entries
                    </p>
                    <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                      {compliances.length}
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
                        Compliance
                      </th>
                      <th className='px-4 py-3 text-left font-medium text-muted-foreground'>
                        Description
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
                    {compliances.map((entry) => (
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
                            className={complianceBadgeClass(entry.compliance)}
                          >
                            {entry.compliance}
                          </Badge>
                        </td>
                        <td className='px-4 py-3 text-muted-foreground'>
                          {entry.complianceDesc || '—'}
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
                        colSpan={4}
                        className='px-4 py-3 font-medium text-muted-foreground'
                      >
                        Total ({compliances.length} entries)
                      </td>
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
