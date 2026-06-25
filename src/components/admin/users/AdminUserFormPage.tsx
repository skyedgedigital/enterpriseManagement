import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  createAppUserSchema,
  type CreateAppUserFormValues,
  type CreateAppUserFormInput,
} from '@/lib/admin/validators';
import { CREATABLE_USER_ROLES, USER_ROLE_LABELS } from '@/lib/rbac';
import { createAppUser } from '@/store/slices/admin/adminUserSlice';

export function AdminUserFormPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAppUserFormInput, unknown, CreateAppUserFormValues>({
    resolver: zodResolver(createAppUserSchema),
    defaultValues: {
      role: 'hr',
      name: '',
      phone: '',
    },
  });

  const role = watch('role');

  const onSubmit = async (data: CreateAppUserFormValues) => {
    const result = await dispatch(createAppUser(data));
    if (createAppUser.fulfilled.match(result)) {
      toast.success(
        'User created — account and profile saved in users/' +
          result.payload.id,
      );
      navigate('/admin/users');
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Add User'
        description='Manage user accounts and roles.'
        action={
          <Button variant='outline' onClick={() => navigate('/admin/users')}>
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Account & profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email*</Label>
                <Input
                  id='email'
                  type='email'
                  autoComplete='off'
                  {...register('email')}
                  placeholder='user@example.com'
                />
                {errors.email && (
                  <p className='text-sm text-destructive'>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>Password *</Label>
                <PasswordInput
                  id='password'
                  autoComplete='new-password'
                  {...register('password')}
                  placeholder='Min. 6 characters'
                />
                {errors.password && (
                  <p className='text-sm text-destructive'>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='name'>Name</Label>
                <Input
                  id='name'
                  type='text'
                  autoComplete='name'
                  {...register('name')}
                  placeholder='Optional'
                />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label htmlFor='phone'>Phone number</Label>
                <Input
                  id='phone'
                  type='tel'
                  autoComplete='tel'
                  {...register('phone')}
                  placeholder='Optional'
                />
                {errors.phone && (
                  <p className='text-sm text-destructive'>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label>Role*</Label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setValue('role', value as CreateAppUserFormValues['role'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATABLE_USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {USER_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className='text-sm text-destructive'>
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => navigate('/admin/users')}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='animate-spin' />}
                <Save className='h-4 w-4' />
                Save and Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
