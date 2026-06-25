import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  addVehicle,
  clearSelectedVehicle,
  fetchVehicleById,
  updateVehicle,
} from '@/store/slices/fleet-manager/vehicleSlice';
import {
  vehicleSchema,
  type VehicleFormValues,
} from '@/lib/fleet-manager/validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { VehicleFuelType } from '@/types';

// Timestamp → Date (for reset)
const tsToDate = (t?: Timestamp): Date | undefined => t?.toDate();

// Date field render helper — format() Date | undefined safe bana
const fmtDate = (d: Date | undefined) => (d ? format(d, 'PPP') : null);

const dateToTs = (d?: Date): Timestamp | undefined =>
  d ? Timestamp.fromDate(d) : undefined;

const formToPayload = (data: VehicleFormValues) => ({
  vehicleNumber: data.vehicleNumber,
  vehicleType: data.vehicleType || undefined,
  location: data.location || undefined,
  vendor: data.vendor || undefined,
  insuranceNumber: data.insuranceNumber || undefined,
  insuranceExpiryDate: dateToTs(data.insuranceExpiryDate),
  gatePassNumber: data.gatePassNumber || undefined,
  gatePassExpiry: dateToTs(data.gatePassExpiry),
  tax: data.tax || undefined,
  taxExpiryDate: dateToTs(data.taxExpiryDate),
  fitness: data.fitness || undefined,
  fitnessExpiry: dateToTs(data.fitnessExpiry),
  loadTest: data.loadTest || undefined,
  loadTestExpiry: dateToTs(data.loadTestExpiry),
  safety: data.safety || undefined,
  safetyExpiryDate: dateToTs(data.safetyExpiryDate),
  puc: data.puc || undefined,
  pucExpiryDate: dateToTs(data.pucExpiryDate),
  fuelType: data.fuelType,
});

type DateFieldProps = {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
};

function DateField({ label, value, onChange }: DateFieldProps) {
  return (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='outline'
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            {fmtDate(value) ?? <span>Pick a date</span>}
            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0'>
          <Calendar
            mode='single'
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function VehicleFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector((state) => state.vehicles);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleNumber: '',
      vehicleType: '',
      location: '',
      vendor: '',
      insuranceNumber: '',
      insuranceExpiryDate: undefined,
      gatePassNumber: '',
      gatePassExpiry: undefined,
      tax: '',
      taxExpiryDate: undefined,
      fitness: '',
      fitnessExpiry: undefined,
      loadTest: '',
      loadTestExpiry: undefined,
      safety: '',
      safetyExpiryDate: undefined,
      puc: '',
      pucExpiryDate: undefined,
      fuelType: 'diesel',
    },
  });
  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchVehicleById(id));
    }
    return () => {
      dispatch(clearSelectedVehicle());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      reset({
        vehicleNumber: selectedItem.vehicleNumber,
        vehicleType: selectedItem.vehicleType ?? '',
        location: selectedItem.location ?? '',
        vendor: selectedItem.vendor ?? '',
        insuranceNumber: selectedItem.insuranceNumber ?? '',
        insuranceExpiryDate: tsToDate(selectedItem.insuranceExpiryDate),
        gatePassNumber: selectedItem.gatePassNumber ?? '',
        gatePassExpiry: tsToDate(selectedItem.gatePassExpiry),
        tax: selectedItem.tax ?? '',
        taxExpiryDate: tsToDate(selectedItem.taxExpiryDate),
        fitness: selectedItem.fitness ?? '',
        fitnessExpiry: tsToDate(selectedItem.fitnessExpiry),
        loadTest: selectedItem.loadTest ?? '',
        loadTestExpiry: tsToDate(selectedItem.loadTestExpiry),
        safety: selectedItem.safety ?? '',
        safetyExpiryDate: tsToDate(selectedItem.safetyExpiryDate),
        puc: selectedItem.puc ?? '',
        pucExpiryDate: tsToDate(selectedItem.pucExpiryDate),
        fuelType: selectedItem.fuelType,
      });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: VehicleFormValues) => {
    const payload = formToPayload(data);

    if (isEditing && id) {
      const result = await dispatch(updateVehicle({ id, data: payload }));
      if (updateVehicle.fulfilled.match(result)) {
        toast.success('Vehicle updated successfully');
        navigate('/fleet-manager/vehicles');
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addVehicle(payload));
      if (addVehicle.fulfilled.match(result)) {
        toast.success('Vehicle created successfully');
        navigate('/fleet-manager/vehicles');
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  if (isEditing && loading && !selectedItem) {
    return <LoadingState type='form' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title={isEditing ? 'Edit Vehicle' : 'Add Vehicle'}
        description={
          isEditing
            ? `Editing: ${selectedItem?.vehicleNumber}`
            : 'Add a new vehicle to the fleet'
        }
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/vehicles')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {/* ── Basic Info ── */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Vehicle Number *</Label>
              <Input
                {...register('vehicleNumber')}
                placeholder='e.g. JH05AB1234'
              />
              {errors.vehicleNumber && (
                <p className='text-sm text-destructive'>
                  {errors.vehicleNumber.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Vehicle Type</Label>
              <Input
                {...register('vehicleType')}
                placeholder='e.g. Truck, JCB'
              />
            </div>

            <div className='space-y-2'>
              <Label>Fuel Type *</Label>
              <Select
                value={watch('fuelType')}
                onValueChange={(v) =>
                  setValue('fuelType', v as VehicleFuelType, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select fuel type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='diesel'>Diesel</SelectItem>
                  <SelectItem value='petrol'>Petrol</SelectItem>
                </SelectContent>
              </Select>
              {errors.fuelType && (
                <p className='text-sm text-destructive'>
                  {errors.fuelType.message}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <Label>Location</Label>
              <Input {...register('location')} placeholder='Site / area' />
            </div>

            <div className='space-y-2'>
              <Label>Vendor</Label>
              <Input {...register('vendor')} placeholder='Vendor name' />
            </div>
          </CardContent>
        </Card>

        {/* ── Documents ── */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Documents & Expiry Dates
            </CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {/* Insurance */}
            <div className='space-y-2'>
              <Label>Insurance Number</Label>
              <Input
                {...register('insuranceNumber')}
                placeholder='Policy number'
              />
            </div>
            <DateField
              label='Insurance Expiry'
              value={watch('insuranceExpiryDate')}
              onChange={(d) => setValue('insuranceExpiryDate', d)}
            />

            {/* Gate Pass */}
            <div className='space-y-2'>
              <Label>Gate Pass Number</Label>
              <Input
                {...register('gatePassNumber')}
                placeholder='Gate pass no.'
              />
            </div>
            <DateField
              label='Gate Pass Expiry'
              value={watch('gatePassExpiry')}
              onChange={(d) => setValue('gatePassExpiry', d)}
            />

            {/* Tax */}
            <div className='space-y-2'>
              <Label>Tax Number</Label>
              <Input {...register('tax')} placeholder='Tax token no.' />
            </div>
            <DateField
              label='Tax Expiry'
              value={watch('taxExpiryDate')}
              onChange={(d) => setValue('taxExpiryDate', d)}
            />

            {/* Fitness */}
            <div className='space-y-2'>
              <Label>Fitness Number</Label>
              <Input {...register('fitness')} placeholder='Fitness cert. no.' />
            </div>
            <DateField
              label='Fitness Expiry'
              value={watch('fitnessExpiry')}
              onChange={(d) => setValue('fitnessExpiry', d)}
            />

            {/* Load Test */}
            <div className='space-y-2'>
              <Label>Load Test</Label>
              <Input {...register('loadTest')} placeholder='Load test no.' />
            </div>
            <DateField
              label='Load Test Expiry'
              value={watch('loadTestExpiry')}
              onChange={(d) => setValue('loadTestExpiry', d)}
            />

            {/* Safety */}
            <div className='space-y-2'>
              <Label>Safety Number</Label>
              <Input {...register('safety')} placeholder='Safety cert. no.' />
            </div>
            <DateField
              label='Safety Expiry'
              value={watch('safetyExpiryDate')}
              onChange={(d) => setValue('safetyExpiryDate', d)}
            />

            {/* PUC */}
            <div className='space-y-2'>
              <Label>PUC</Label>
              <Input {...register('puc')} placeholder='PUC cert. no.' />
            </div>
            <DateField
              label='PUC Expiry'
              value={watch('pucExpiryDate')}
              onChange={(d) => setValue('pucExpiryDate', d)}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/fleet-manager/vehicles')}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
            <Save className='h-4 w-4' />
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  );
}
