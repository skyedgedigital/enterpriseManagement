// @/components/fleet-manager/fuel-management/FuelPricesPage.tsx

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, Fuel, RefreshCw } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { fuelPriceBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { fuelPriceExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fuelPriceSchema, type FuelPriceFormInput, type FuelPriceFormValues } from '@/lib/fleet-manager/validators';
import { fetchFuelPrices, upsertFuelPrice } from '@/store/slices/fleet-manager/fuelManagementSlice';

export function FuelPricesPage() {
  const dispatch = useAppDispatch();
  const { prices, loading } = useAppSelector((state) => state.fuelPrices);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FuelPriceFormInput, unknown, FuelPriceFormValues>({
    resolver: zodResolver(fuelPriceSchema),
    defaultValues: { fuelType: undefined, price: '' },
  });

  useEffect(() => {
    dispatch(fetchFuelPrices());
  }, [dispatch]);

  const onSubmit = async (data: FuelPriceFormValues) => {
    const result = await dispatch(
      upsertFuelPrice({ fuelType: data.fuelType, price: data.price }),
    );
    if (upsertFuelPrice.fulfilled.match(result)) {
      toast.success(
        `${data.fuelType.charAt(0).toUpperCase() + data.fuelType.slice(1)} price updated`,
      );
      reset({ fuelType: undefined, price: '' });
    } else {
      toast.error(result.payload as string);
    }
  };

  const petrolPrice = prices.find((p) => p.fuelType === 'petrol');
  const dieselPrice = prices.find((p) => p.fuelType === 'diesel');

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Fuel Prices'
        description='Set current petrol and diesel rates per litre'
        action={
          <div className="flex gap-2">
            <ExportExcelButton config={fuelPriceExportConfig} items={prices} />
            <BulkUploadDialog
              config={fuelPriceBulkConfig}
              onSuccess={() => dispatch(fetchFuelPrices())}
            />
            <Button
              variant='outline'
              size='sm'
              onClick={() => dispatch(fetchFuelPrices())}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Update form */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Update Price</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
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

              <div className='space-y-2'>
                <Label htmlFor='price'>Price per Litre (₹) *</Label>
                <Input
                  id='price'
                  type='number'
                  step='0.01'
                  min='0'
                  {...register('price')}
                  placeholder='e.g. 96.72'
                />
                {errors.price && (
                  <p className='text-sm text-destructive'>
                    {errors.price.message}
                  </p>
                )}
              </div>

              <Button
                type='submit'
                disabled={isSubmitting || loading}
                className='w-full'
              >
                {(isSubmitting || loading) && (
                  <Loader2 className='animate-spin' />
                )}
                <Save className='h-4 w-4' />
                Save Price
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current rates display */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Fuel className='h-4 w-4' />
              Current Rates
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {prices.length === 0 ? (
              <p className='py-4 text-center text-sm text-muted-foreground'>
                No prices saved yet. Add petrol and diesel rates.
              </p>
            ) : (
              <>
                <div
                  className={`flex items-center justify-between rounded-lg border px-5 py-4 ${
                    petrolPrice
                      ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                      : 'border-dashed'
                  }`}
                >
                  <div>
                    <p className='text-xs text-muted-foreground'>Petrol</p>
                    {petrolPrice ? (
                      <p className='text-2xl font-bold text-green-700 dark:text-green-400'>
                        ₹{petrolPrice.price.toFixed(2)}
                        <span className='ml-1 text-sm font-normal'>/litre</span>
                      </p>
                    ) : (
                      <p className='text-sm text-muted-foreground'>Not set</p>
                    )}
                  </div>
                  <Fuel
                    className={`h-8 w-8 ${petrolPrice ? 'text-green-400 dark:text-green-700' : 'text-muted-foreground/30'}`}
                  />
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border px-5 py-4 ${
                    dieselPrice
                      ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
                      : 'border-dashed'
                  }`}
                >
                  <div>
                    <p className='text-xs text-muted-foreground'>Diesel</p>
                    {dieselPrice ? (
                      <p className='text-2xl font-bold text-yellow-700 dark:text-yellow-400'>
                        ₹{dieselPrice.price.toFixed(2)}
                        <span className='ml-1 text-sm font-normal'>/litre</span>
                      </p>
                    ) : (
                      <p className='text-sm text-muted-foreground'>Not set</p>
                    )}
                  </div>
                  <Fuel
                    className={`h-8 w-8 ${dieselPrice ? 'text-yellow-400 dark:text-yellow-700' : 'text-muted-foreground/30'}`}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
