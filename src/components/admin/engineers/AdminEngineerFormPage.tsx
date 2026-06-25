import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  engineerSchema,
  type EngineerFormValues,
} from '@/lib/admin/validators';
import { fetchAdminDepartments } from '@/store/slices/admin/adminDepartmentSlice';
import {
  addEngineer,
  clearSelectedEngineer,
  fetchEngineerById,
  updateEngineer,
} from '@/store/slices/admin/adminEngineerSlice';

export function AdminEngineerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedEngineer, loading } = useAppSelector(
    (state) => state.engineers,
  );
  const { items: departments, loading: departmentsLoading } = useAppSelector(
    (state) => state.adminDepartments,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EngineerFormValues>({
    resolver: zodResolver(engineerSchema),
  });

  useEffect(() => {
    dispatch(fetchAdminDepartments());
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchEngineerById(id));
    }
    return () => {
      dispatch(clearSelectedEngineer());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedEngineer) {
      reset({
        name: selectedEngineer.name,
        departmentId: selectedEngineer.departmentId,
      });
    }
  }, [isEditing, selectedEngineer, reset]);

  const onSubmit = async (data: EngineerFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateEngineer({ id, data }));
      if (updateEngineer.fulfilled.match(result)) {
        toast.success('Engineer updated successfully');
        navigate('/admin/engineers');
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addEngineer(data));
      if (addEngineer.fulfilled.match(result)) {
        toast.success('Engineer created successfully');
        navigate('/admin/engineers');
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  if (isEditing && loading && !selectedEngineer) {
    return <LoadingState type='form' />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title={isEditing ? 'Edit Engineer' : 'Add Engineer'}
        description={
          isEditing
            ? `Editing: ${selectedEngineer?.name}`
            : 'Create a new engineer'
        }
        action={
          <Button
            variant='outline'
            onClick={() => navigate('/admin/engineers')}
          >
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Engineer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Engineer Name *</Label>
                <Input
                  id='name'
                  {...register('name')}
                  placeholder='Enter engineer name'
                />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
            <div className='space-y-2'>
              <Label>Department *</Label>
              <Select
                value={watch('departmentId')}
                onValueChange={(v) =>
                  setValue('departmentId', v, { shouldValidate: true })
                }
                disabled={departmentsLoading || departments.length === 0}
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

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/admin/engineers')}
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
