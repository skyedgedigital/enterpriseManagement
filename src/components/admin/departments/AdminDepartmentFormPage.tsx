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
  adminDepartmentSchema,
  type AdminDepartmentFormValues,
} from '@/lib/admin/validators';
import {
  addAdminDepartment,
  clearSelectedAdminDepartment,
  fetchAdminDepartmentById,
  updateAdminDepartment,
} from '@/store/slices/admin/adminDepartmentSlice';

export function AdminDepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector(
    (state) => state.adminDepartments,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminDepartmentFormValues>({
    resolver: zodResolver(adminDepartmentSchema),
  });

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchAdminDepartmentById(id));
    }
    return () => {
      dispatch(clearSelectedAdminDepartment());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      reset({ name: selectedItem.name });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: AdminDepartmentFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateAdminDepartment({ id, data }));
      if (updateAdminDepartment.fulfilled.match(result)) {
        toast.success('Department updated successfully');
        navigate('/admin/departments');
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addAdminDepartment(data));
      if (addAdminDepartment.fulfilled.match(result)) {
        toast.success('Department created successfully');
        navigate('/admin/departments');
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
        title={isEditing ? 'Edit Department' : 'Add Department'}
        description={
          isEditing
            ? `Editing: ${selectedItem?.name}`
            : 'Create a new department'
        }
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/admin/departments')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Department Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Department Name *</Label>
                <Input
                  id='name'
                  {...register('name')}
                  placeholder='Enter department name'
                />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/admin/departments')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='animate-spin' />}
                <Save className='h-4 w-4' />
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
