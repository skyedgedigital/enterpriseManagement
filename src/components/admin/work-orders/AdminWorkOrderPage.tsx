import { useDebouncedCollectionSearch } from '@/hooks/useDebouncedCollectionSearch';

import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { WorkOrder, FleetWorkOrder } from '@/types';
import { formatTimestamp } from '@/components/shared/utils';

const fmtAmt = (n?: number) =>
  n !== undefined
    ? '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    : '—';

function HRWorkOrdersTab() {
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
  } = useDebouncedCollectionSearch<WorkOrder>('workOrders');

  const columns: Column<WorkOrder>[] = [
    {
      key: 'workOrderNumber',
      header: 'Work Order No.',
      render: (wo) => <span className='font-medium'>{wo.workOrderNumber}</span>,
    },
    { key: 'jobDesc', header: 'Job Description' },
    { key: 'orderDesc', header: 'Order Description' },
    { key: 'section', header: 'Section' },
    { key: 'state', header: 'State' },
    {
      key: 'validFrom',
      header: 'Valid From',
      render: (wo) => formatTimestamp(wo.validFrom),
    },
    {
      key: 'validTo',
      header: 'Valid To',
      render: (wo) => formatTimestamp(wo.validTo),
    },
    {
      key: 'newPfApplicable',
      header: 'PF Cap',
      render: (wo) =>
        wo.newPfApplicable ? (
          <Badge
            variant='outline'
            className='border-blue-300 bg-blue-50 text-blue-700'
          >
            Capped ₹15k
          </Badge>
        ) : (
          <Badge variant='outline' className='border-gray-300 text-gray-600'>
            Full
          </Badge>
        ),
    },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  if (allItems.length === 0) {
    return (
      <EmptyState
        title='No HR work orders'
        description='No HR work orders have been added yet.'
      />
    );
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder='Search HR work orders...'
      searchValue={query}
      onSearchChange={setQuery}
      searchLoading={searchLoading}
    />
  );
}

function FleetWorkOrdersTab() {
  const {
    query,
    setQuery,
    items,
    allItems,
    initialLoading,
    searchLoading,
  } = useDebouncedCollectionSearch<FleetWorkOrder>('fleetWorkOrders');

  const columns: Column<FleetWorkOrder>[] = [
    {
      key: 'workOrderNumber',
      header: 'Work Order No.',
      render: (wo) => <span className='font-medium'>{wo.workOrderNumber}</span>,
    },
    { key: 'workDescription', header: 'Description' },
    {
      key: 'workOrderValue',
      header: 'Value',
      render: (wo) => fmtAmt(wo.workOrderValue),
    },
    {
      key: 'workOrderBalance',
      header: 'Balance',
      render: (wo) => fmtAmt(wo.workOrderBalance),
    },
    {
      key: 'workOrderValidity',
      header: 'Valid Till',
      render: (wo) => formatTimestamp(wo.workOrderValidity),
    },
    {
      key: 'shiftStatus',
      header: 'Shift',
      render: (wo) =>
        wo.shiftStatus ? (
          <Badge
            variant='outline'
            className='border-green-300 bg-green-50 text-green-700'
          >
            Active
          </Badge>
        ) : (
          <Badge variant='outline' className='border-gray-300 text-gray-600'>
            Off
          </Badge>
        ),
    },
    {
      key: 'units',
      header: 'Units',
      render: (wo) => (
        <div className='flex flex-wrap gap-1'>
          {wo.units?.map((u) => (
            <Badge key={u} variant='secondary' className='text-xs'>
              {u}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  if (initialLoading && allItems.length === 0) return <LoadingState />;

  if (allItems.length === 0) {
    return (
      <EmptyState
        title='No fleet work orders'
        description='No fleet work orders have been added yet.'
      />
    );
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      searchPlaceholder='Search Fleet work orders...'
      searchValue={query}
      onSearchChange={setQuery}
      searchLoading={searchLoading}
    />
  );
}

export function AdminWorkOrdersPage() {
  return (
    <div className='space-y-6'>
      <PageHeader
        title='Work Orders'
        description='HR and Fleet Manager work orders'
      />

      <Tabs defaultValue='fleet'>
        <TabsList>
          <TabsTrigger value='fleet'>Fleet Work Orders</TabsTrigger>
          <TabsTrigger value='hr'>HR Work Orders</TabsTrigger>
        </TabsList>

        <TabsContent value='fleet' className='mt-4'>
          <FleetWorkOrdersTab />
        </TabsContent>

        <TabsContent value='hr' className='mt-4'>
          <HRWorkOrdersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
