// @/components/fleet-manager/store-management/ToolAllotmentFormPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { parse } from 'date-fns';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

import {
  toolStoreManagementSchema,
  type ToolStoreManagementFormValues,
  type ToolStoreManagementFormInput,
} from '@/lib/fleet-manager/validators';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import {
  addAllotment,
  fetchTools,
} from '@/store/slices/fleet-manager/toolStoreManagementSlice';

// yyyy-MM-dd string → Firestore Timestamp
const toTimestamp = (dateStr: string): Timestamp => {
  const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
  return Timestamp.fromDate(parsed);
};

export function ToolAllotmentFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const { tools } = useAppSelector((state) => state.tools);
  const { loading } = useAppSelector((state) => state.toolStoreManagement);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<
    ToolStoreManagementFormInput,
    unknown,
    ToolStoreManagementFormValues
  >({
    resolver: zodResolver(toolStoreManagementSchema),
    defaultValues: {
      vehicleId: '',
      toolId: '',
      quantity: '',
      dateOfAllotment: '',
      dateOfReturn: '',
    },
  });

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchTools());
  }, [dispatch]);

  const onSubmit = async (data: ToolStoreManagementFormValues) => {
    const selectedTool = tools.find((t) => t.id === data.toolId);

    const result = await dispatch(
      addAllotment({
        vehicleId: data.vehicleId,
        toolId: data.toolId,
        tool: selectedTool?.toolName ?? '',
        quantity: data.quantity,
        dateOfAllotment: toTimestamp(data.dateOfAllotment),
        dateOfReturn: toTimestamp(data.dateOfReturn),
        status: 'active',
      }),
    );

    if (addAllotment.fulfilled.match(result)) {
      toast.success('Tool allotted successfully');
      navigate('/fleet-manager/store-management/allotments');
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='New Allotment'
        description='Allot a tool to a vehicle'
        action={
          <Button
            variant='outline'
            onClick={() =>
              navigate('/fleet-manager/store-management/allotments')
            }
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Allotment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              {/* Vehicle */}
              <div className='space-y-2'>
                <Label>Vehicle *</Label>
                <Controller
                  name='vehicleId'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select vehicle...' />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.vehicleNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vehicleId && (
                  <p className='text-sm text-destructive'>
                    {errors.vehicleId.message}
                  </p>
                )}
              </div>

              {/* Tool */}
              <div className='space-y-2'>
                <Label>Tool *</Label>
                <Controller
                  name='toolId'
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select tool...' />
                      </SelectTrigger>
                      <SelectContent>
                        {tools.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.toolName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.toolId && (
                  <p className='text-sm text-destructive'>
                    {errors.toolId.message}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div className='space-y-2'>
                <Label htmlFor='quantity'>Quantity *</Label>
                <Input
                  id='quantity'
                  type='number'
                  min={1}
                  {...register('quantity')}
                  placeholder='e.g. 2'
                />
                {errors.quantity && (
                  <p className='text-sm text-destructive'>
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Date of Allotment */}
              <div className='space-y-2'>
                <Label>Date of Allotment *</Label>
                <Controller
                  name='dateOfAllotment'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select allotment date'
                      fromYear={2020}
                      toYear={2035}
                    />
                  )}
                />
                {errors.dateOfAllotment && (
                  <p className='text-sm text-destructive'>
                    {errors.dateOfAllotment.message}
                  </p>
                )}
              </div>

              {/* Date of Return */}
              <div className='space-y-2'>
                <Label>Date of Return *</Label>
                <Controller
                  name='dateOfReturn'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select return date'
                      fromYear={2020}
                      toYear={2035}
                    />
                  )}
                />
                {errors.dateOfReturn && (
                  <p className='text-sm text-destructive'>
                    {errors.dateOfReturn.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  navigate('/fleet-manager/store-management/allotments')
                }
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting || loading}>
                {(isSubmitting || loading) && (
                  <Loader2 className='animate-spin' />
                )}
                <Save className='h-4 w-4' />
                Allot Tool
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
