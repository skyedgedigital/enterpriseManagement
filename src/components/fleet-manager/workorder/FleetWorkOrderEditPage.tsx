import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchFleetWorkOrderById,
  updateFleetWorkOrderEdits,
  clearFleetWorkOrderSelected,
} from '@/store/slices/fleet-manager/workOrderSlice';
import {
  fleetWorkOrderEditFormSchema,
  type FleetWorkOrderEditFormInput,
  type FleetWorkOrderEditFormValues,
} from '@/lib/fleet-manager/validators';
import {
  FLEET_WO_UNIT_PRESETS,
  FLEET_WO_PRESET_VALUES,
} from '@/lib/fleet-manager/constants';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';

function validityToInput(v: unknown): string {
  if (v != null && typeof (v as Timestamp).toDate === 'function') {
    return format((v as Timestamp).toDate(), 'yyyy-MM-dd');
  }
  return '';
}

export function FleetWorkOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedWorkOrder, loading } = useAppSelector(
    (s) => s.fleetWorkOrders,
  );

  const [workOrderNumberDisplay, setWorkOrderNumberDisplay] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customUnitKeys, setCustomUnitKeys] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<
    FleetWorkOrderEditFormInput,
    unknown,
    FleetWorkOrderEditFormValues
  >({
    resolver: zodResolver(fleetWorkOrderEditFormSchema),
    defaultValues: {
      workDescription: '',
      workOrderValue: '',
      workOrderBalance: '',
      workOrderValidity: '',
      shiftStatus: false,
      units: [],
    },
  });

  const units = watch('units') ?? [];

  useEffect(() => {
    if (!id) return;
    setReady(false);
    void dispatch(fetchFleetWorkOrderById(id));
    return () => {
      dispatch(clearFleetWorkOrderSelected());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (!id || !selectedWorkOrder || selectedWorkOrder.id !== id) return;

    const wo = selectedWorkOrder;
    const unitList = wo.units ?? [];
    const extras = unitList.filter((u) => !FLEET_WO_PRESET_VALUES.has(u));

    setWorkOrderNumberDisplay(wo.workOrderNumber);
    setCustomUnitKeys(extras);

    reset({
      workDescription: wo.workDescription,
      workOrderValue: String(wo.workOrderValue),
      workOrderBalance: String(wo.workOrderBalance),
      workOrderValidity: validityToInput(wo.workOrderValidity),
      shiftStatus: wo.shiftStatus ?? false,
      units: unitList,
    });
    setReady(true);
  }, [selectedWorkOrder, id, reset]);

  const toggleUnit = (value: string) => {
    const set = new Set(units);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setValue('units', [...set], { shouldValidate: true });
  };

  const addCustomUnit = () => {
    const cu = customUnit.trim();
    if (!cu) {
      toast.error('Enter a unit name');
      return;
    }
    const lower = cu.toLowerCase();
    if (
      FLEET_WO_UNIT_PRESETS.some(
        (p) =>
          p.value.toLowerCase() === lower || p.label.toLowerCase() === lower,
      )
    ) {
      toast.error('That unit is already available above');
      return;
    }
    if (customUnitKeys.some((u) => u.toLowerCase() === lower)) {
      toast.error('This custom unit is already in the list');
      return;
    }
    setCustomUnitKeys((prev) => [...prev, cu]);
    setValue('units', [...units, cu], { shouldValidate: true });
    setCustomUnit('');
  };

  const onSubmit = async (data: FleetWorkOrderEditFormValues) => {
    if (!id) return;
    const result = await dispatch(
      updateFleetWorkOrderEdits({ id, form: data }),
    );
    if (updateFleetWorkOrderEdits.fulfilled.match(result)) {
      toast.success('Work order updated');
      navigate('/fleet-manager/work-orders');
    } else {
      toast.error((result.payload as string) || 'Update failed');
    }
  };

  if (!id) return null;

  if (!ready && loading) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Edit fleet work order' />
        <LoadingState type='form' />
      </div>
    );
  }

  if (!ready || !selectedWorkOrder) {
    return (
      <div className='space-y-6'>
        <PageHeader title='Edit fleet work order' />
        <p className='text-sm text-muted-foreground'>
          Could not load work order.
        </p>
        <Button
          variant='outline'
          onClick={() => navigate('/fleet-manager/work-orders')}
        >
          Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Edit fleet work order'
        description='Work order number and line items are not changed here.'
        action={
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/fleet-manager/work-orders')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Work order</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Work order number</Label>
              <p className='rounded-md border bg-muted px-3 py-2 text-sm font-medium'>
                {workOrderNumberDisplay}
              </p>
              <p className='text-xs text-muted-foreground'>Cannot be edited.</p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Work order value (₹) *</Label>
                <Input
                  type='text'
                  inputMode='decimal'
                  {...register('workOrderValue')}
                />
                {errors.workOrderValue && (
                  <p className='text-sm text-destructive'>
                    {String(errors.workOrderValue.message)}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label>Work order balance (₹) *</Label>
                <Input
                  type='text'
                  inputMode='decimal'
                  {...register('workOrderBalance')}
                />
                {errors.workOrderBalance && (
                  <p className='text-sm text-destructive'>
                    {String(errors.workOrderBalance.message)}
                  </p>
                )}
              </div>
              <div className='space-y-2 sm:col-span-2'>
                <Label>Validity *</Label>
                <DatePicker
                  value={watch('workOrderValidity') ?? ''}
                  onChange={(v) =>
                    setValue('workOrderValidity', v, { shouldValidate: true })
                  }
                  placeholder='Select validity date'
                />
                {errors.workOrderValidity && (
                  <p className='text-sm text-destructive'>Required</p>
                )}
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Description *</Label>
              <Textarea rows={3} {...register('workDescription')} />
              {errors.workDescription && (
                <p className='text-sm text-destructive'>
                  {String(errors.workDescription.message)}
                </p>
              )}
            </div>

            <div className='flex items-center gap-3'>
              <Switch
                checked={!!watch('shiftStatus')}
                onCheckedChange={(v) => setValue('shiftStatus', v)}
              />
              <Label>Shift-based work order</Label>
            </div>

            <div className='space-y-2'>
              <Label>Units of measurement *</Label>
              <div className='flex flex-wrap gap-3 pt-1'>
                {FLEET_WO_UNIT_PRESETS.map((u) => (
                  <label
                    key={u.value}
                    className='flex cursor-pointer items-center gap-2 text-sm'
                  >
                    <Checkbox
                      checked={units.includes(u.value)}
                      onCheckedChange={() => toggleUnit(u.value)}
                    />
                    {u.label}
                  </label>
                ))}
                {customUnitKeys.map((value) => (
                  <label
                    key={value}
                    className='flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-primary/40 bg-muted/40 px-2 py-1 text-sm'
                  >
                    <Checkbox
                      checked={units.includes(value)}
                      onCheckedChange={() => toggleUnit(value)}
                    />
                    <span>{value}</span>
                    <span className='text-xs text-muted-foreground'>
                      (custom)
                    </span>
                  </label>
                ))}
              </div>
              {errors.units && (
                <p className='text-sm text-destructive'>
                  {String(errors.units.message)}
                </p>
              )}
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
              <div className='max-w-sm flex-1 space-y-2'>
                <Label>Custom unit (optional)</Label>
                <Input
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder='e.g. trips'
                />
              </div>
              <Button type='button' variant='secondary' onClick={addCustomUnit}>
                Add custom unit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/fleet-manager/work-orders')}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
            <Save className='h-4 w-4' />
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
