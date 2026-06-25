// @/components/fleet-manager/compliance/ComplianceFormPage.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
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
  complianceSchema,
  type ComplianceFormValues,
  type ComplianceFormInput,
} from '@/lib/fleet-manager/validators';
import { COMPLIANCE_TYPES } from '@/types';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import { addCompliance } from '@/store/slices/fleet-manager/compliancesSlice';

export function ComplianceFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const { loading } = useAppSelector((state) => state.compliances);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ComplianceFormInput, unknown, ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      vehicleId: '',
      compliance: undefined,
      complianceDesc: '',
      amount: '',
      date: '',
    },
  });

  const watchedCompliance = useWatch({ control, name: 'compliance' });

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const onSubmit = async (data: ComplianceFormValues) => {
    const selectedVehicle = vehicles.find((v) => v.id === data.vehicleId);
    const parsedDate = parse(data.date, 'yyyy-MM-dd', new Date());

    const result = await dispatch(
      addCompliance({
        vehicleId: data.vehicleId,
        vehicleNumber: selectedVehicle?.vehicleNumber ?? '',
        compliance: data.compliance,
        complianceDesc: data.complianceDesc || '',
        amount: data.amount,
        date: Timestamp.fromDate(parsedDate),
      }),
    );

    if (addCompliance.fulfilled.match(result)) {
      toast.success('Compliance entry added successfully');
      navigate('/fleet-manager/compliance');
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='New Compliance Entry'
        description='Record a vehicle compliance expense'
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/compliance')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle className='text-base'>Entry Details</CardTitle>
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

              {/* Compliance Type */}
              <div className='space-y-2'>
                <Label>Compliance Type *</Label>
                <Controller
                  name='compliance'
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select type...' />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLIANCE_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.compliance && (
                  <p className='text-sm text-destructive'>
                    {errors.compliance.message}
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className='space-y-2'>
                <Label htmlFor='amount'>Amount (₹) *</Label>
                <Input
                  id='amount'
                  type='number'
                  step='0.01'
                  min='0'
                  {...register('amount')}
                  placeholder='e.g. 5000'
                />
                {errors.amount && (
                  <p className='text-sm text-destructive'>
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Date */}
              <div className='space-y-2'>
                <Label>Date *</Label>
                <Controller
                  name='date'
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder='Select date'
                      fromYear={2020}
                      toYear={2035}
                    />
                  )}
                />
                {errors.date && (
                  <p className='text-sm text-destructive'>
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description — only shown when OTHER is selected */}
            {watchedCompliance === 'OTHER' && (
              <div className='space-y-2'>
                <Label htmlFor='complianceDesc'>
                  Description *
                  <span className='ml-2 text-xs font-normal text-muted-foreground'>
                    Required for OTHER
                  </span>
                </Label>
                <Textarea
                  id='complianceDesc'
                  {...register('complianceDesc')}
                  placeholder='Describe the compliance...'
                  rows={3}
                />
                {errors.complianceDesc && (
                  <p className='text-sm text-destructive'>
                    {errors.complianceDesc.message}
                  </p>
                )}
              </div>
            )}

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/fleet-manager/compliance')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting || loading}>
                {(isSubmitting || loading) && (
                  <Loader2 className='animate-spin' />
                )}
                <Save className='h-4 w-4' />
                Add Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
