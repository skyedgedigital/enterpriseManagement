import { useEffect } from 'react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchWorkOrders } from '@/store/slices/workOrderSlice';
import { fetchFleetWorkOrders } from '@/store/slices/fleet-manager/workOrderSlice';

import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

import type { WorkOrder, FleetWorkOrder } from '@/types';
import { formatTimestamp } from '@/components/shared/utils';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const fmtAmt = (n?: number) =>
  n !== undefined
    ? '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
    : '—';

// ----------------------------------------------------------------
// HR Work Orders tab
// ----------------------------------------------------------------
function HRWorkOrdersTab() {
  const { items, loading } = useAppSelector((state) => state.workOrders);

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

  if (loading && items.length === 0) return <LoadingState />;

  return items.length === 0 ? (
    <EmptyState
      title='No HR work orders'
      description='No HR work orders found.'
    />
  ) : (
    <DataTable
      data={items}
      columns={columns}
      searchKey='workOrderNumber'
      searchPlaceholder='Search HR work orders...'
    />
  );
}

// ----------------------------------------------------------------
// Fleet Work Orders tab
// ----------------------------------------------------------------
function FleetWorkOrdersTab() {
  const { items, loading } = useAppSelector((state) => state.fleetWorkOrders);

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

  if (loading && items.length === 0) return <LoadingState />;

  return items.length === 0 ? (
    <EmptyState
      title='No Fleet work orders'
      description='No Fleet work orders found.'
    />
  ) : (
    <DataTable
      data={items}
      columns={columns}
      searchKey='workOrderNumber'
      searchPlaceholder='Search Fleet work orders...'
    />
  );
}

// ----------------------------------------------------------------
// Main Page
// ----------------------------------------------------------------
export function AdminWorkOrdersPage() {
  const dispatch = useAppDispatch();

  const hrItems = useAppSelector((state) => state.workOrders.items);
  const fleetItems = useAppSelector((state) => state.fleetWorkOrders.items);
  const hrLoading = useAppSelector((state) => state.workOrders.loading);
  const fleetLoading = useAppSelector((state) => state.fleetWorkOrders.loading);

  useEffect(() => {
    dispatch(fetchWorkOrders());
    dispatch(fetchFleetWorkOrders());
  }, [dispatch]);

  const isLoading =
    hrLoading &&
    hrItems.length === 0 &&
    fleetLoading &&
    fleetItems.length === 0;

  if (isLoading) return <LoadingState />;

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Work Orders'
        description='View HR and Fleet Manager work orders'
      />

      {/* Summary cards */}
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Card className='border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>HR Work Orders</p>
            <p className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
              {hrItems.length}
            </p>
          </CardContent>
        </Card>
        <Card className='border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Fleet Work Orders</p>
            <p className='text-2xl font-bold text-green-600 dark:text-green-400'>
              {fleetItems.length}
            </p>
          </CardContent>
        </Card>
        <Card className='border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Fleet Total Value</p>
            <p className='text-xl font-bold text-orange-600 dark:text-orange-400'>
              {fmtAmt(
                fleetItems.reduce((s, wo) => s + (wo.workOrderValue ?? 0), 0),
              )}
            </p>
          </CardContent>
        </Card>
        <Card className='border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950'>
          <CardContent className='p-4'>
            <p className='text-xs text-muted-foreground'>Fleet Balance</p>
            <p className='text-xl font-bold text-purple-600 dark:text-purple-400'>
              {fmtAmt(
                fleetItems.reduce((s, wo) => s + (wo.workOrderBalance ?? 0), 0),
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue='fleet'>
        <TabsList>
          <TabsTrigger value='fleet'>
            Fleet Work Orders ({fleetItems.length})
          </TabsTrigger>
          <TabsTrigger value='hr'>
            HR Work Orders ({hrItems.length})
          </TabsTrigger>
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
