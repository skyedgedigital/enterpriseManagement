import { useState } from 'react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import {
  ExternalLink,
  FileImage,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  FileText,
} from 'lucide-react';

import type { Chalan, Engineer } from '@/types';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { engineerService } from '@/services/admin/engineer.service';

function isFirestoreTimestamp(v: unknown): v is Timestamp {
  return v != null && typeof (v as Timestamp).toDate === 'function';
}

function formatChalanDate(d: Chalan['date']): string {
  if (isFirestoreTimestamp(d)) return format(d.toDate(), 'dd MMM yyyy');
  return '—';
}

function formatInr(n: number): string {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

// FleetChalanCard props mein add:
type FleetChalanCardProps = {
  chalan: Chalan;
  departmentName?: string;
  workOrderLabel?: string;
  onDelete: () => void;
  onUpdate: (patch: {
    location?: string;
    engineerId?: string;
  }) => Promise<void>;
  onCreateInvoice: () => void;
};
export function FleetChalanCard({
  chalan,
  departmentName,
  workOrderLabel,
  onDelete,
  onUpdate,
  onCreateInvoice,
}: FleetChalanCardProps) {
  const title =
    chalan.chalanNumber?.trim() || `Chalan ${chalan.id.slice(0, 8)}…`;
  const total = chalan.totalCost ?? 0;

  // ── Edit state ──
  const [editing, setEditing] = useState(false);
  const [location, setLocation] = useState(chalan.location ?? '');
  const [engineerId, setEngineerId] = useState(chalan.engineerId ?? '');
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [engLoading, setEngLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEditOpen = async () => {
    setEditing(true);
    // Jab edit open ho to latest values ke sath state reset karein
    setLocation(chalan.location ?? '');
    setEngineerId(chalan.engineerId ?? '');
    setEngLoading(true);
    try {
      const list = await engineerService.getEngineersByDepartment(
        chalan.departmentId,
      );
      setEngineers(list ?? []);
      console.log('list', list);
    } catch {
      setEngineers([]);
    } finally {
      setEngLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setLocation(chalan.location ?? '');
    setEngineerId(chalan.engineerId ?? '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ location: location.trim(), engineerId });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  // Find engineer name for static display if we have the data
  const assignedEngineer = engineers.find((e) => e.id === chalan.engineerId);

  return (
    <Card className='overflow-hidden border-border/80 py-0 shadow-md'>
      <CardHeader className='border-b bg-[#4A90E2] px-2 py-2 text-white'>
        <div className='flex items-center justify-between'>
          <div className='text-base font-semibold tracking-tight'>
            Chalan number: {title}
          </div>
          <div className='w-4' /> {/* spacer */}
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-4'>
        {/* ── Meta row ── */}
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <dl className='grid min-w-0 flex-1 grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2'>
            <div>
              <dt className='text-muted-foreground'>Date</dt>
              <dd className='font-medium'>{formatChalanDate(chalan.date)}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Work order</dt>
              <dd className='font-medium break-all'>
                {workOrderLabel ?? chalan.workOrderId}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Location</dt>
              <dd className='font-medium'>{chalan.location?.trim() || '—'}</dd>
            </div>
            <div>
              <dt className='text-muted-foreground'>Department</dt>
              <dd className='font-medium'>
                {departmentName ?? chalan.departmentId}
              </dd>
            </div>
            <div className='sm:col-span-2'>
              <dt className='text-muted-foreground'>Work description</dt>
              <dd className='text-foreground/90'>
                {chalan.workDescription?.trim() || '—'}
              </dd>
            </div>
            <div className='sm:col-span-2'>
              <dt className='text-muted-foreground'>Engineer</dt>
              <dd className='text-foreground/90'>
                {assignedEngineer?.name || '—'}
              </dd>
            </div>
          </dl>

          {/* ── Badges & Top Edit Button ── */}
          <div className='flex shrink-0 flex-col gap-2 lg:items-end'>
            {!editing && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-full border-[#4A90E2] text-[#4A90E2] hover:bg-[#4A90E2]/10 sm:w-auto'
                onClick={handleEditOpen}
              >
                <Pencil className='mr-1.5 h-3.5 w-3.5' />
                Edit Details
              </Button>
            )}
            <div className='flex flex-wrap gap-2 lg:justify-end'>
              <Badge variant={chalan.verified ? 'default' : 'secondary'}>
                {chalan.verified ? 'Verified' : 'Not verified'}
              </Badge>
              <Badge variant='outline' className='capitalize'>
                {chalan.status ?? '—'}
              </Badge>
            </div>
          </div>
        </div>

        {/* ── Refined Inline edit form ── */}
        {editing && (
          <div className='animate-in fade-in slide-in-from-top-2 rounded-xl border border-[#4A90E2]/30 bg-muted/20 p-5 shadow-sm ring-1 ring-[#4A90E2]/10'>
            <div className='mb-4 flex items-center justify-between border-b border-border/50 pb-2'>
              <h3 className='text-sm font-semibold tracking-tight text-foreground'>
                Update Details
              </h3>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label>Location</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder='Site / area'
                  className='bg-background shadow-sm'
                />
              </div>

              <div className='space-y-2'>
                <Label>Engineer</Label>
                {engLoading ? (
                  <div className='flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Loading engineers…
                  </div>
                ) : (
                  <Select
                    value={engineerId}
                    onValueChange={setEngineerId}
                    disabled={engineers.length === 0}
                  >
                    <SelectTrigger className='bg-background shadow-sm'>
                      <SelectValue
                        placeholder={
                          engineers.length === 0
                            ? 'No engineers in this dept'
                            : 'Select engineer'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {engineers.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Buttons moved inside the form container */}
            <div className='mt-6 flex items-center justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleCancel}
                disabled={saving}
              >
                <X className='mr-1.5 h-4 w-4' />
                Cancel
              </Button>
              <Button
                type='button'
                size='sm'
                onClick={handleSave}
                disabled={saving}
                className='bg-[#4A90E2] text-white hover:bg-[#4A90E2]/90'
              >
                {saving ? (
                  <Loader2 className='mr-1.5 h-4 w-4 animate-spin' />
                ) : (
                  <Save className='mr-1.5 h-4 w-4' />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* ── Items table ── */}
        <div className='rounded-lg border bg-muted/30'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-160 border-collapse text-sm'>
              <thead>
                <tr className='border-b bg-muted/80 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                  <th className='whitespace-nowrap px-3 py-2'>Item</th>
                  <th className='whitespace-nowrap px-3 py-2'>Vehicle</th>
                  <th className='whitespace-nowrap px-3 py-2'>Start</th>
                  <th className='whitespace-nowrap px-3 py-2'>End</th>
                  <th className='whitespace-nowrap px-3 py-2'>Unit</th>
                  <th className='whitespace-nowrap px-3 py-2 text-right'>
                    Qty
                  </th>
                  <th className='whitespace-nowrap px-3 py-2 text-right'>
                    Amount (INR)
                  </th>
                </tr>
              </thead>
              <tbody>
                {chalan.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className='px-3 py-6 text-center text-muted-foreground'
                    >
                      No items
                    </td>
                  </tr>
                ) : (
                  chalan.items.map((row, i) => (
                    <tr
                      key={`${row.item}-${i}`}
                      className={cn(
                        'border-b border-border/60 last:border-0',
                        i % 2 === 1 && 'bg-muted/20',
                      )}
                    >
                      <td className='max-w-35 truncate px-3 py-2 font-mono text-xs'>
                        {row.itemName ?? '-'}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2'>
                        {row.vehicleNumber ?? '—'}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2'>
                        {row.startTime}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2'>
                        {row.endTime}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2'>
                        {row.unit}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2 text-right tabular-nums'>
                        {row.hours}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums'>
                        {formatInr(row.itemCosting)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className='border-t-2 border-[#4A90E2]/30 bg-[#4A90E2]/5'>
                  <td
                    colSpan={6}
                    className='px-3 py-2 text-right text-sm font-semibold'
                  >
                    Total
                  </td>
                  <td className='whitespace-nowrap px-3 py-2 text-right text-base font-bold tabular-nums text-[#4A90E2]'>
                    {formatInr(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </CardContent>

      <CardFooter className='flex flex-col gap-3 border-t bg-muted/20 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'>
        <div className='flex flex-wrap gap-2'>
          {chalan.file ? (
            <Button variant='outline' size='sm' asChild>
              <a href={chalan.file} target='_blank' rel='noopener noreferrer'>
                <FileImage className='mr-1.5 h-3.5 w-3.5' />
                View physical chalan
                <ExternalLink className='ml-1 h-3 w-3 opacity-70' />
              </a>
            </Button>
          ) : (
            <Button variant='outline' size='sm' disabled>
              <FileImage className='mr-1.5 h-3.5 w-3.5' />
              View physical chalan
            </Button>
          )}
          <Button variant='secondary' size='sm' disabled={!!chalan.verified}>
            {chalan.verified ? 'Already verified' : 'Mark verified'}
          </Button>
          <Button variant='secondary' size='sm' disabled={!!chalan.signed}>
            {chalan.signed ? 'Signed' : 'Mark as signed'}
          </Button>
        </div>

        <div className='flex flex-wrap gap-2 sm:justify-end'>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            onClick={onDelete}
          >
            <Trash2 className='mr-1.5 h-3.5 w-3.5' />
            Delete chalan
          </Button>
          <Button
            type='button'
            variant='default'
            size='sm'
            onClick={onCreateInvoice}
            disabled={!!chalan.invoiceCreated}
          >
            <FileText className='mr-1.5 h-3.5 w-3.5' />
            {chalan.invoiceCreated ? 'Invoice Created' : 'Create Invoice'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
