import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, CircleX, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchFleetWorkOrders } from '@/store/slices/fleet-manager/workOrderSlice';
import { createFleetChalan } from '@/store/slices/fleet-manager/chalanSlice';
import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';
import { engineerService } from '@/services/admin/engineer.service';
import {
  chalanFormSchema,
  type ChalanFormValues,
  type ChalanFormInput,
} from '@/lib/fleet-manager/validators';
import type { FleetWorkOrderItem, Engineer } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import { fleetChalanService } from '@/services/fleet-manger/chalan.service';

const defaultLine = {
  item: '',
  vehicleNumber: '',
  unit: 'hours',
  hours: '',
  startTime: '',
  endTime: '',
};

export function DriverCreateChalanForm() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { items: workOrders, loading: woLoading } = useAppSelector(
    (s) => s.fleetWorkOrders,
  );
  const { items: departments, loading: depLoading } = useAppSelector(
    (s) => s.adminDepartments,
  );
  const { items: vehicles, loading: vehicleLoading } = useAppSelector(
    (state) => state.vehicles,
  );
  const { loading: saving } = useAppSelector((s) => s.fleetChalans);

  const [woUnits, setWoUnits] = useState<string[]>([]);
  const [workOrderItems, setWorkOrderItems] = useState<FleetWorkOrderItem[]>(
    [],
  );
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [generatingChalanNumber, setGeneratingChalanNumber] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ChalanFormInput, unknown, ChalanFormValues>({
    resolver: zodResolver(chalanFormSchema),
    defaultValues: {
      workOrderId: '',
      departmentId: '',
      engineerId: '',
      date: '',
      chalanNumber: '',
      location: '',
      workDescription: '',
      status: 'signed',
      items: [defaultLine],
      commentByDriver: '',
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const workOrderId = watch('workOrderId');
  const departmentId = watch('departmentId');

  useEffect(() => {
    void dispatch(fetchFleetWorkOrders());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchAdminDepartments());
  }, [dispatch]);
  useEffect(() => {
    void dispatch(fetchVehicles());
  }, [dispatch]);

  useEffect(() => {
    if (!departmentId) {
      setEngineers([]);
      setValue('engineerId', '');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const fetchedEngineers =
          await engineerService.getEngineersByDepartment(departmentId);
        if (cancelled) return;
        setEngineers(fetchedEngineers || []);
        setValue('engineerId', '');
      } catch {
        if (!cancelled) {
          toast.error('Could not load engineers for this department.');
          setEngineers([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [departmentId, setValue]);

  useEffect(() => {
    if (!workOrderId) {
      setWoUnits([]);
      setWorkOrderItems([]);
      setValue('workDescription', '');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const wo = await fleetWorkOrderService.getById(workOrderId);
        if (cancelled) return;
        setValue('workDescription', wo.workDescription ?? '');
        setWoUnits(wo.units ?? []);
        const lines =
          await fleetWorkOrderService.getItemsByWorkOrderId(workOrderId);
        if (cancelled) return;
        setWorkOrderItems(lines);
        if (lines.length === 0) {
          toast.message('No catalogue items on this work order yet.');
        }
      } catch {
        if (!cancelled) toast.error('Could not load work order details.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workOrderId, setValue]);

  const onSubmit = async (data: ChalanFormValues) => {
    if (!user?.uid) {
      toast.error('Please sign in to create a chalan.');
      return;
    }
    const result = await dispatch(
      createFleetChalan({ form: data, driverUid: user.uid }),
    );
    if (createFleetChalan.fulfilled.match(result)) {
      toast.success('Chalan created successfully');
      reset({
        workOrderId: '',
        departmentId: '',
        engineerId: '',
        date: '',
        chalanNumber: '',
        location: '',
        workDescription: '',
        status: 'signed',
        items: [{ ...defaultLine }],
        commentByDriver: '',
      });
      setWoUnits([]);
      setWorkOrderItems([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast.error((result.payload as string) || 'Failed to create chalan');
    }
  };

  const handleAutoGenerateChalanNumber = async () => {
    setGeneratingChalanNumber(true);
    try {
      const generatedNumber = await fleetChalanService.generateChalanNumber();
      setValue('chalanNumber', generatedNumber, { shouldValidate: true });
      toast.success(`Chalan number generated: ${generatedNumber}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate chalan number';
      toast.error(message);
    } finally {
      setGeneratingChalanNumber(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Create chalan'
        description='Fill work order line items, upload chalan photo, and submit.'
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Header</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Chalan number *</Label>
              <div className='flex gap-2'>
                <Input
                  {...register('chalanNumber')}
                  placeholder='e.g. CH-2026-001'
                  className='flex-1'
                />
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  onClick={handleAutoGenerateChalanNumber}
                  disabled={generatingChalanNumber}
                  title='Auto-generate chalan number'
                  className='mt-0'
                >
                  {generatingChalanNumber ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Zap className='h-4 w-4' />
                  )}
                </Button>
              </div>
              {errors.chalanNumber && (
                <p className='text-sm text-destructive'>
                  {errors.chalanNumber.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Work order *</Label>
              <Select
                value={watch('workOrderId')}
                onValueChange={(v) =>
                  setValue('workOrderId', v, { shouldValidate: true })
                }
                disabled={woLoading || workOrders.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      woLoading ? 'Loading…' : 'Select fleet work order'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id}>
                      {wo.workOrderNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.workOrderId && (
                <p className='text-sm text-destructive'>
                  {errors.workOrderId.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Department *</Label>
              <Select
                value={watch('departmentId')}
                onValueChange={(v) =>
                  setValue('departmentId', v, { shouldValidate: true })
                }
                disabled={depLoading || departments.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select department' />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className='text-sm text-destructive'>
                  {errors.departmentId.message}
                </p>
              )}
            </div>
            <div className='space-y-2'>
              <Label>Engineer *</Label>
              <Select
                value={watch('engineerId')}
                onValueChange={(v) =>
                  setValue('engineerId', v, { shouldValidate: true })
                }
                disabled={!departmentId || engineers.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select engineer' />
                </SelectTrigger>
                <SelectContent>
                  {engineers.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.engineerId && (
                <p className='text-sm text-destructive'>
                  {errors.engineerId.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Location</Label>
              <Input {...register('location')} placeholder='Site / area' />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Chalan date *</Label>
              <DatePicker
                value={watch('date')}
                onChange={(v) => setValue('date', v, { shouldValidate: true })}
                placeholder='Pick date'
              />
              {errors.date && (
                <p className='text-sm text-destructive'>
                  {errors.date.message}
                </p>
              )}
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Work description</Label>
              <Textarea
                readOnly
                {...register('workDescription')}
                rows={2}
                className='bg-muted/50'
              />
            </div>

            <div className='space-y-2'>
              <Label>Chalan photo * (JPG / PNG, max 5 MB)</Label>
              <Controller
                name='file'
                control={control}
                render={({ field: { onChange, value: _v, ...rest } }) => (
                  <Input
                    {...rest}
                    ref={fileInputRef}
                    type='file'
                    accept='image/jpeg,image/jpg,image/png'
                    className='cursor-pointer'
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      onChange(f ?? undefined);
                    }}
                  />
                )}
              />
              {errors.file && (
                <p className='text-sm text-destructive'>
                  {String(errors.file.message)}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Status *</Label>
              <Select
                value={watch('status')}
                onValueChange={(v) =>
                  setValue('status', v as 'signed' | 'unsigned', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='signed'>Signed</SelectItem>
                  <SelectItem value='unsigned'>Unsigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Comment by driver</Label>
              <Textarea rows={2} {...register('commentByDriver')} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Items *</CardTitle>
            <Button
              type='button'
              variant='secondary'
              size='sm'
              onClick={() =>
                append({
                  ...defaultLine,
                  unit: woUnits[0] ?? 'hours',
                })
              }
            >
              <Plus className='h-4 w-4' />
              Add row
            </Button>
          </CardHeader>
          <CardContent className='space-y-8'>
            {errors.items?.message && (
              <p className='text-sm text-destructive'>{errors.items.message}</p>
            )}

            {fields.map((field, index) => (
              <div
                key={field.id}
                className='relative space-y-4 rounded-lg border p-4'
              >
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Item {index + 1}</span>
                  {index > 0 && (
                    <Button
                      type='button'
                      variant='destructive'
                      size='icon-sm'
                      onClick={() => remove(index)}
                      aria-label='Remove row'
                    >
                      <CircleX className='h-4 w-4' />
                    </Button>
                  )}
                </div>

                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
                  <div className='space-y-2'>
                    <Label>Catalogue item *</Label>
                    <Select
                      value={watch(`items.${index}.item`)}
                      onValueChange={(v) =>
                        setValue(`items.${index}.item`, v, {
                          shouldValidate: true,
                        })
                      }
                      disabled={!workOrderId || workOrderItems.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select line item' />
                      </SelectTrigger>
                      <SelectContent>
                        {workOrderItems.map((li) => (
                          <SelectItem key={li.id} value={li.id}>
                            {li.itemName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.item && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.item?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Vehicle *</Label>
                    <Select
                      value={watch(`items.${index}.vehicleNumber`)}
                      onValueChange={(v) =>
                        setValue(`items.${index}.vehicleNumber`, v, {
                          shouldValidate: true,
                        })
                      }
                      disabled={vehicleLoading || vehicles.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Vehicle no.' />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.vehicleNumber}>
                            {v.vehicleNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.vehicleNumber && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.vehicleNumber?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Unit *</Label>
                    <Select
                      value={watch(`items.${index}.unit`)}
                      onValueChange={(v) =>
                        setValue(`items.${index}.unit`, v, {
                          shouldValidate: true,
                        })
                      }
                      disabled={woUnits.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Unit' />
                      </SelectTrigger>
                      <SelectContent>
                        {woUnits.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.unit && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.unit?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Quantity *</Label>
                    <Input
                      inputMode='decimal'
                      {...register(`items.${index}.hours`)}
                    />
                    {errors.items?.[index]?.hours && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.hours?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Start time *</Label>
                    <Input
                      type='time'
                      {...register(`items.${index}.startTime`)}
                    />
                    {errors.items?.[index]?.startTime && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.startTime?.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>End time *</Label>
                    <Input
                      type='time'
                      {...register(`items.${index}.endTime`)}
                    />
                    {errors.items?.[index]?.endTime && (
                      <p className='text-xs text-destructive'>
                        {errors.items[index]?.endTime?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button type='submit' disabled={saving}>
            {saving && <Loader2 className='h-4 w-4 animate-spin' />}
            Submit chalan
          </Button>
        </div>
      </form>
    </div>
  );
}
