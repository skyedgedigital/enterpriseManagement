import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  editAppUserSchema,
  type EditAppUserFormValues,
  type EditAppUserFormInput,
} from '@/lib/admin/validators';
import { USER_ROLES, USER_ROLE_LABELS } from '@/lib/rbac';
import { adminUserService } from '@/services/admin/user.service';
import {
  updateAdminUser,
  clearAdminUserError,
} from '@/store/slices/admin/adminUserSlice';

import { LoadingState } from '@/components/shared/LoadingState';

export function AdminUserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [initializing, setInitializing] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditAppUserFormInput, unknown, EditAppUserFormValues>({
    resolver: zodResolver(editAppUserSchema),
    defaultValues: {
      role: 'hr',
      email: '',
      name: '',
      phone: '',
    },
  });

  const role = watch('role');

  useEffect(() => {
    dispatch(clearAdminUserError());
  }, [dispatch]);

  useEffect(() => {
    if (!id) {
      toast.error('Missing user');
      navigate('/admin/users');
      return;
    }
    let cancelled = false;
    setInitializing(true);
    adminUserService.getById(id).then((u) => {
      if (cancelled) return;
      if (!u) {
        toast.error('User not found');
        navigate('/admin/users');
        return;
      }
      reset({
        email: u.email ?? '',
        name: u.name ?? '',
        phone: u.phone ?? '',
        role: u.role,
      });
      setInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, navigate, reset]);

  const onSubmit = async (data: EditAppUserFormValues) => {
    if (!id) return;
    dispatch(clearAdminUserError());
    const result = await dispatch(updateAdminUser({ uid: id, data }));
    if (updateAdminUser.fulfilled.match(result)) {
      toast.success('User updated');
      navigate('/admin/users');
    } else {
      toast.error(result.payload as string);
    }
  };

  if (initializing) {
    return <LoadingState />;
  }

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Edit user'
        description='Update saved profile fields in Firestore. Sign-in password is unchanged here.'
        action={
          <Button variant='outline' onClick={() => navigate('/admin/users')}>
            <ArrowLeft className='h-4 w-4' />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
            <p className='text-muted-foreground text-sm'>
              Editing email only updates the email value stored with this user
              in Firestore. It does not change the Firebase Authentication
              sign-in address unless you update that separately in the Firebase
              console.
            </p>

            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2 sm:col-span-2'>
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
                    setValue('role', value as EditAppUserFormValues['role'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
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
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
