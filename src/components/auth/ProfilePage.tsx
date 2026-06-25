import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, User, KeyRound } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { updateUserPassword } from '@/store/slices/authSlice';
import {
  updatePasswordSchema,
  type UpdatePasswordFormValues,
} from '@/lib/validators';

import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading, role, roleStatus } = useAppSelector(
    (state) => state.auth,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    const result = await dispatch(
      updateUserPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    );
    if (updateUserPassword.fulfilled.match(result)) {
      toast.success('Password updated successfully');
      reset();
    } else {
      toast.error(result.payload as string);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader title='Profile' description='Manage your account settings' />

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <User className='h-5 w-5 text-primary' />
              </div>
              <div>
                <CardTitle className='text-lg'>Account Info</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label className='text-muted-foreground text-xs uppercase tracking-wider'>
                Email
              </Label>
              <p className='mt-1 font-medium'>{user?.email ?? 'N/A'}</p>
            </div>
            <Separator />
            <div>
              <Label className='text-muted-foreground text-xs uppercase tracking-wider'>
                Display Name
              </Label>
              <p className='mt-1 font-medium'>{user?.displayName ?? 'N/A'}</p>
            </div>
            <Separator />
            <div>
              <Label className='text-muted-foreground text-xs uppercase tracking-wider'>
                User Role
              </Label>
              <p className='mt-1 font-mono text-sm text-muted-foreground'>
                {role}
              </p>
            </div>
            <Separator />
            <div>
              <Label className='text-muted-foreground text-xs uppercase tracking-wider'>
                Role Status
              </Label>
              <p className='mt-1 font-mono text-sm text-muted-foreground'>
                {roleStatus}
              </p>
            </div>
            <Separator />
            <div>
              <Label className='text-muted-foreground text-xs uppercase tracking-wider'>
                User ID
              </Label>
              <p className='mt-1 font-mono text-sm text-muted-foreground'>
                {user?.uid}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
                <KeyRound className='h-5 w-5 text-primary' />
              </div>
              <div>
                <CardTitle className='text-lg'>Update Password</CardTitle>
                <CardDescription>Change your account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='currentPassword'>Current Password</Label>
                <PasswordInput
                  id='currentPassword'
                  autoComplete='current-password'
                  {...register('currentPassword')}
                />
                {errors.currentPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='newPassword'>New Password</Label>
                <PasswordInput
                  id='newPassword'
                  autoComplete='new-password'
                  {...register('newPassword')}
                />
                {errors.newPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                <PasswordInput
                  id='confirmPassword'
                  autoComplete='new-password'
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className='text-sm text-destructive'>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='animate-spin' />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
