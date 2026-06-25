import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchUserRoles } from '@/store/slices/admin/adminUserSlice';
import { USER_ROLE_LABELS } from '@/lib/rbac';
import type { UserRoleRecord } from '@/services/admin/user.service';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

export function AdminUserPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.adminUsers);

  useEffect(() => {
    dispatch(fetchUserRoles());
  }, [dispatch]);

  const columns: Column<UserRoleRecord>[] = [
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true,
      render: (user) => user.email ?? '—',
    },
    {
      key: 'name',
      header: 'Name',
      render: (user) => user.name ?? '—',
    },
    {
      key: 'phone',
      header: 'Phone',
      hideOnMobile: true,
      render: (user) => user.phone ?? '—',
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge variant='secondary'>{USER_ROLE_LABELS[user.role]}</Badge>
      ),
    },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Users'
        description='Manage login users and their roles.'
        action={
          <Button onClick={() => navigate('/admin/users/new')}>
            <Plus className='h-4 w-4' />
            Add User
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title='No role documents'
          description='Create accounts in Firebase Auth and save role plus optional profile fields in users/{uid}.'
          action={
            <Button onClick={() => navigate('/admin/users/new')}>
              <Plus className='h-4 w-4' />
              Add User
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKeys={['email', 'name', 'phone', 'role']}
          searchPlaceholder='Search by email, name, or phone…'
          actions={(user) => (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='shrink-0'
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/admin/users/${user.id}/edit`);
              }}
            >
              <Pencil className='mr-1 h-4 w-4' />
              Edit
            </Button>
          )}
        />
      )}
    </div>
  );
}
