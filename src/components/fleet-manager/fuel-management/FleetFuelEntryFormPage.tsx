import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Fuel } from 'lucide-react';
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

import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import {
  fuelEntrySchema,
  type FuelEntryFormInput,
  type FuelEntryFormValues,
} from '@/lib/fleet-manager/validators';
import {
  addFuelEntry,
  fetchFuelPrices,
} from '@/store/slices/fleet-manager/fuelManagementSlice';

export function FuelEntryFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { items: vehicles } = useAppSelector((state) => state.vehicles);
  const { prices } = useAppSelector((state) => state.fuelPrices);
  const { loading } = useAppSelector((state) => state.fuelEntries);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FuelEntryFormInput, unknown, FuelEntryFormValues>({
    resolver: zodResolver(fuelEntrySchema),
    defaultValues: {
      vehicleId: '',
      fuelType: undefined,
      fuelQuantity: '',
      amount: '',
      meterReading: '',
      date: '',
    },
  });

  const watchedFuelType = useWatch({ control, name: 'fuelType' });
  const watchedQty = useWatch({ control, name: 'fuelQuantity' });

  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchFuelPrices());
  }, [dispatch]);

  // Auto-calculate amount from price × quantity
  useEffect(() => {
    const priceObj = prices.find((p) => p.fuelType === watchedFuelType);
    const qty = parseFloat(watchedQty as string);
    if (priceObj && !isNaN(qty) && qty > 0) {
      setValue('amount', String(parseFloat((qty * priceObj.price).toFixed(2))));
    }
  }, [watchedFuelType, watchedQty, prices, setValue]);

  const onSubmit = async (data: FuelEntryFormValues) => {
    const selectedVehicle = vehicles.find((v) => v.id === data.vehicleId);
    const parsedDate = parse(data.date, 'yyyy-MM-dd', new Date());

    const result = await dispatch(
      addFuelEntry({
        vehicleId: data.vehicleId,
        vehicleNumber: selectedVehicle?.vehicleNumber ?? '',
        fuelType: data.fuelType,
        fuelQuantity: data.fuelQuantity,
        amount: data.amount,
        meterReading: data.meterReading,
        date: Timestamp.fromDate(parsedDate),
      }),
    );

    if (addFuelEntry.fulfilled.match(result)) {
      toast.success('Fuel entry added successfully');
      navigate('/fleet-manager/fuel-management/entries');
    } else {
      toast.error(result.payload as string);
    }
  };

  const petrolPrice = prices.find((p) => p.fuelType === 'petrol');
  const dieselPrice = prices.find((p) => p.fuelType === 'diesel');

  return (
    <div className='space-y-6'>
      <PageHeader
        title='New Fuel Entry'
        description='Record a fuel fill-up for a vehicle'
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/fuel-management/entries')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Form */}
        <div className='lg:col-span-2'>
          <Card>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
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

                  {/* Fuel Type */}
                  <div className='space-y-2'>
                    <Label>Fuel Type *</Label>
                    <Controller
                      name='fuelType'
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ''}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select fuel type...' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='petrol'>Petrol</SelectItem>
                            <SelectItem value='diesel'>Diesel</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.fuelType && (
                      <p className='text-sm text-destructive'>
                        {errors.fuelType.message}
                      </p>
                    )}
                  </div>

                  {/* Fuel Quantity */}
                  <div className='space-y-2'>
                    <Label htmlFor='fuelQuantity'>
                      Fuel Quantity (litres) *
                    </Label>
                    <Input
                      id='fuelQuantity'
                      type='number'
                      step='0.001'
                      min='0'
                      {...register('fuelQuantity')}
                      placeholder='e.g. 35.500'
                    />
                    {errors.fuelQuantity && (
                      <p className='text-sm text-destructive'>
                        {errors.fuelQuantity.message}
                      </p>
                    )}
                  </div>

                  {/* Amount — auto-filled, editable */}
                  <div className='space-y-2'>
                    <Label htmlFor='amount'>
                      Amount (₹) *
                      {watchedFuelType &&
                        prices.find((p) => p.fuelType === watchedFuelType) && (
                          <span className='ml-2 text-xs font-normal text-muted-foreground'>
                            auto-calculated · editable
                          </span>
                        )}
                    </Label>
                    <Input
                      id='amount'
                      type='number'
                      step='0.01'
                      min='0'
                      {...register('amount')}
                      placeholder='e.g. 2800.00'
                    />
                    {errors.amount && (
                      <p className='text-sm text-destructive'>
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  {/* Meter Reading */}
                  <div className='space-y-2'>
                    <Label htmlFor='meterReading'>Meter Reading *</Label>
                    <Input
                      id='meterReading'
                      {...register('meterReading')}
                      placeholder='e.g. 45230'
                    />
                    {errors.meterReading && (
                      <p className='text-sm text-destructive'>
                        {errors.meterReading.message}
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

                <div className='flex justify-end gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      navigate('/fleet-manager/fuel-management/entries')
                    }
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

        {/* Current Fuel Prices reference */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Fuel className='h-4 w-4' />
                Current Rates
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {prices.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                  No prices set yet.
                </p>
              ) : (
                <>
                  {petrolPrice && (
                    <div className='flex items-center justify-between rounded-lg border px-4 py-3'>
                      <span className='text-sm font-medium'>Petrol</span>
                      <span className='font-semibold'>
                        ₹{petrolPrice.price.toFixed(2)}/L
                      </span>
                    </div>
                  )}
                  {dieselPrice && (
                    <div className='flex items-center justify-between rounded-lg border px-4 py-3'>
                      <span className='text-sm font-medium'>Diesel</span>
                      <span className='font-semibold'>
                        ₹{dieselPrice.price.toFixed(2)}/L
                      </span>
                    </div>
                  )}
                </>
              )}
              <p className='text-xs text-muted-foreground'>
                Amount is auto-calculated from qty × rate. You can override it.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
