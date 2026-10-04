import { useNavigate } from 'react-router-dom';
import { Pencil, Plus } from 'lucide-react';

import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';
import { USER_ROLE_LABELS } from '@/lib/rbac';
import type { UserRoleRecord } from '@/services/admin/user.service';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';

export function AdminUserPage() {
  const navigate = useNavigate();
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
  } = useDebouncedCollectionSearch<UserRoleRecord>('users');

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

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Users'
        description={
          query.trim()
            ? `${items.length} match${items.length !== 1 ? 'es' : ''}`
            : `${allItems.length} user${allItems.length !== 1 ? 's' : ''} total`
        }
        action={
          <Button onClick={() => navigate('/admin/users/new')}>
            <Plus className='h-4 w-4' />
            Add User
          </Button>
        }
      />

      {allItems.length === 0 ? (
        <EmptyState
          title='No users'
          description='Add your first user to get started.'
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
        searchPlaceholder='Search by email, name, or phone…'
        searchValue={query}
        onSearchChange={setQuery}
        searchLoading={searchLoading}
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
