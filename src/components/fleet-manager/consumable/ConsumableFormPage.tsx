import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchConsumableById,
  createConsumable,
  updateConsumable,
  clearSelected,
} from '@/store/slices/fleet-manager/consumable';
import { fetchVehicles } from '@/store/slices/fleet-manager/vehicleSlice';
import {
  consumableFormSchema,
  type ConsumableFormValues,
  type ConsumableFormInput,
} from '@/lib/fleet-manager/validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';

export function ConsumableFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { items: vehicles, loading: vehicleLoading } = useAppSelector(
    (state) => state.vehicles,
  );
  const { selectedConsumable, loading } = useAppSelector(
    (state) => state.consumables,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConsumableFormInput, unknown, ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues: {
      vehicleNumber: '',
      consumableItem: '',
      quantity: '',
      amount: '',
      date: '',
    },
  });

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchConsumableById(id));
    }
    return () => {
      dispatch(clearSelected());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedConsumable) {
      const dateStr =
        selectedConsumable.date &&
        typeof selectedConsumable.date.toDate === 'function'
          ? format(selectedConsumable.date.toDate(), 'yyyy-MM-dd')
          : '';

      reset({
        vehicleNumber: selectedConsumable.vehicleNumber ?? '',
        consumableItem: selectedConsumable.consumableItem ?? '',
        quantity:
          selectedConsumable.quantity != null
            ? String(selectedConsumable.quantity)
            : '',
        amount:
          selectedConsumable.amount != null
            ? String(selectedConsumable.amount)
            : '',
        date: dateStr,
      });
    }
  }, [isEditing, selectedConsumable, reset]);

  const onSubmit = async (data: ConsumableFormValues) => {
    try {
      if (isEditing && id) {
        const result = await dispatch(updateConsumable({ id, form: data }));
        if (updateConsumable.fulfilled.match(result)) {
          toast.success('Consumable updated successfully');
          navigate('/fleet-manager/consumables');
        } else {
          toast.error((result.payload as string) || 'Update failed');
        }
      } else {
        const result = await dispatch(createConsumable(data));
        if (createConsumable.fulfilled.match(result)) {
          toast.success('Consumable added successfully');
          navigate('/fleet-manager/consumables');
        } else {
          toast.error((result.payload as string) || 'Creation failed');
        }
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  if (isEditing && loading && !selectedConsumable) {
    return <LoadingState type='form' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title={isEditing ? 'Edit Consumable' : 'Add Consumable'}
        description={
          isEditing
            ? `Editing: ${selectedConsumable?.vehicleNumber}`
            : 'Add a new consumable entry'
        }
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/consumables')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Consumable Details</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-2'>
            {/* Vehicle Number */}
            <div className='space-y-2'>
              <Label htmlFor='vehicleNumber'>Vehicle Number *</Label>
              <Select
                value={watch('vehicleNumber')}
                onValueChange={(value) => setValue('vehicleNumber', value)}
                disabled={vehicleLoading || vehicles.length === 0}
              >
                <SelectTrigger id='vehicleNumber'>
                  <SelectValue
                    placeholder={
                      vehicleLoading ? 'Loading vehicles...' : 'Select vehicle'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.vehicleNumber}>
                      {v.vehicleNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleNumber && (
                <p className='text-sm text-destructive'>
                  {String(errors.vehicleNumber.message)}
                </p>
              )}
            </div>

            {/* Consumable Item */}
            <div className='space-y-2'>
              <Label htmlFor='consumableItem'>Consumable Item *</Label>
              <Input
                id='consumableItem'
                {...register('consumableItem')}
                placeholder='e.g. Diesel, Oil, Spare Part'
              />
              {errors.consumableItem && (
                <p className='text-sm text-destructive'>
                  {String(errors.consumableItem.message)}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className='space-y-2'>
              <Label htmlFor='quantity'>Quantity *</Label>
              <Input
                id='quantity'
                type='text'
                inputMode='decimal'
                {...register('quantity')}
                placeholder='0'
              />
              {errors.quantity && (
                <p className='text-sm text-destructive'>
                  {String(errors.quantity.message)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className='space-y-2'>
              <Label htmlFor='amount'>Amount (₹) *</Label>
              <Input
                id='amount'
                type='text'
                inputMode='decimal'
                {...register('amount')}
                placeholder='0'
              />
              {errors.amount && (
                <p className='text-sm text-destructive'>
                  {String(errors.amount.message)}
                </p>
              )}
            </div>

            {/* Date */}
            <div className='space-y-2 sm:col-span-2'>
              <Label htmlFor='date'>Date *</Label>
              <Input id='date' type='date' {...register('date')} />
              {errors.date && (
                <p className='text-sm text-destructive'>
                  {String(errors.date.message)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex gap-2 justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate('/fleet-manager/consumables')}
          >
            Cancel
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
