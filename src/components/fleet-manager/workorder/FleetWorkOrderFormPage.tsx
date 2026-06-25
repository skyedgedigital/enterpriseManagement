import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Plus, CircleX } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { createFleetWorkOrder } from '@/store/slices/fleet-manager/workOrderSlice';
import {
  fleetWorkOrderFormSchema,
  type FleetWorkOrderFormValues,
} from '@/lib/fleet-manager/validators';

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

const UNIT_PRESETS: { value: string; label: string }[] = [
  { value: 'months', label: 'Months' },
  { value: 'days', label: 'Days' },
  { value: 'shift', label: 'Shift' },
  { value: 'hours', label: 'Hours' },
  { value: 'ot', label: 'Over time' },
];

const defaultItem = {
  itemName: '',
  hsnNo: '',
  itemPrice: '',
  itemNumber: '',
};

export function FleetWorkOrderFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [customUnit, setCustomUnit] = useState('');
  const [customUnitKeys, setCustomUnitKeys] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(fleetWorkOrderFormSchema),
    defaultValues: {
      workOrderNumber: '',
      workDescription: '',
      workOrderValue: '',
      workOrderBalance: '',
      workOrderValidity: '',
      shiftStatus: false,
      units: [] as string[],
      items: [defaultItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const units = watch('units') ?? [];

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
      UNIT_PRESETS.some(
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
    toast.success('Custom unit added — uncheck to leave it off the payload');
  };

  const onSubmit = async (data: FleetWorkOrderFormValues) => {
    const result = await dispatch(createFleetWorkOrder(data));
    if (createFleetWorkOrder.fulfilled.match(result)) {
      toast.success('Fleet work order created');
      navigate('/fleet-manager/work-orders');
    } else {
      toast.error((result.payload as string) || 'Create failed');
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Add fleet work order'
        description='Separate from HR statutory work orders.'
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
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Work order number *</Label>
                <Input {...register('workOrderNumber')} autoComplete='off' />
                {errors.workOrderNumber && (
                  <p className='text-sm text-destructive'>
                    {String(errors.workOrderNumber.message)}
                  </p>
                )}
              </div>
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
              <p className='text-sm text-muted-foreground'>
                Select at least one. You can add a one-off custom unit for this
                WO only.
              </p>
              <div className='flex flex-wrap gap-3 pt-1'>
                {UNIT_PRESETS.map((u) => (
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

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Line items *</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {errors.items && typeof errors.items.message === 'string' && (
              <p className='text-sm text-destructive'>{errors.items.message}</p>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className='rounded-md border p-4 space-y-3'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Item {index + 1}
                </p>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                  <div className='space-y-2 sm:col-span-2'>
                    <Label>Item name *</Label>
                    <Input {...register(`items.${index}.itemName` as const)} />
                    {errors.items?.[index]?.itemName && (
                      <p className='text-sm text-destructive'>
                        {String(errors.items[index]?.itemName?.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>HSN no. *</Label>
                    <Input {...register(`items.${index}.hsnNo` as const)} />
                    {errors.items?.[index]?.hsnNo && (
                      <p className='text-sm text-destructive'>
                        {String(errors.items[index]?.hsnNo?.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <Label>Item number *</Label>
                    <Input
                      type='text'
                      inputMode='numeric'
                      {...register(`items.${index}.itemNumber` as const)}
                    />
                    {errors.items?.[index]?.itemNumber && (
                      <p className='text-sm text-destructive'>
                        {String(errors.items[index]?.itemNumber?.message)}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2 sm:col-span-2'>
                    <Label>Item price (₹) *</Label>
                    <Input
                      type='text'
                      inputMode='decimal'
                      {...register(`items.${index}.itemPrice` as const)}
                    />
                    {errors.items?.[index]?.itemPrice && (
                      <p className='text-sm text-destructive'>
                        {String(errors.items[index]?.itemPrice?.message)}
                      </p>
                    )}
                  </div>
                  {index > 0 && (
                    <div className='flex items-end sm:col-span-4'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => remove(index)}
                      >
                        <CircleX className='h-4 w-4' />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button
              type='button'
              variant='secondary'
              onClick={() => append({ ...defaultItem })}
            >
              <Plus className='h-4 w-4' />
              Add item
            </Button>
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
            Create
          </Button>
        </div>
      </form>
    </div>
  );
}
