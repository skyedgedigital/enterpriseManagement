// @/components/fleet-manager/store-management/ToolFormPage.tsx

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';

import {
  toolSchema,
  type ToolFormValues,
  type ToolFormInput,
} from '@/lib/fleet-manager/validators';
import {
  addTool,
  clearSelectedTool,
  fetchToolById,
  updateTool,
} from '@/store/slices/fleet-manager/toolStoreManagementSlice';

export function ToolFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedTool, loading } = useAppSelector((state) => state.tools);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ToolFormInput, unknown, ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      toolName: '',
      quantity: '1',
      price: '',
    },
  });

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchToolById(id));
    }
    return () => {
      dispatch(clearSelectedTool());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedTool) {
      reset({
        toolName: selectedTool.toolName,
        quantity: selectedTool.quantity.toString(),
        price: selectedTool.price.toString(),
      });
    }
  }, [isEditing, selectedTool, reset]);

  const onSubmit = async (data: ToolFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateTool({ id, data }));
      if (updateTool.fulfilled.match(result)) {
        toast.success('Tool updated successfully');
        navigate('/fleet-manager/store-management/tools');
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addTool(data));
      if (addTool.fulfilled.match(result)) {
        toast.success('Tool created successfully');
        navigate('/fleet-manager/store-management/tools');
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  if (isEditing && loading && !selectedTool) {
    return <LoadingState type='form' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title={isEditing ? 'Edit Tool' : 'Add Tool'}
        description={
          isEditing
            ? `Editing: ${selectedTool?.toolName}`
            : 'Add a new tool to inventory'
        }
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/fleet-manager/store-management/tools')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Tool Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              {/* Tool Name */}
              <div className='space-y-2'>
                <Label htmlFor='toolName'>Tool Name *</Label>
                <Input
                  id='toolName'
                  {...register('toolName')}
                  placeholder='e.g. Hydraulic Jack'
                />
                {errors.toolName && (
                  <p className='text-sm text-destructive'>
                    {errors.toolName.message}
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
                  placeholder='e.g. 5'
                />
                {errors.quantity && (
                  <p className='text-sm text-destructive'>
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className='space-y-2'>
                <Label htmlFor='price'>Price (₹) *</Label>
                <Input
                  id='price'
                  type='number'
                  min={0}
                  step='0.01'
                  {...register('price')}
                  placeholder='e.g. 2500'
                />
                {errors.price && (
                  <p className='text-sm text-destructive'>
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() =>
                  navigate('/fleet-manager/store-management/tools')
                }
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                <Save className='mr-2 h-4 w-4' />
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
