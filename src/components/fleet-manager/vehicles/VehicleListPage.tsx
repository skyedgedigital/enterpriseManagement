import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import {
  fetchVehicles,
  deleteVehicle,
} from '@/store/slices/fleet-manager/vehicleSlice';
import type { Vehicle } from '@/types';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { BulkUploadDialog } from '@/components/shared/BulkUploadDialog';
import { ExportExcelButton } from '@/components/shared/ExportExcelButton';
import { createVehicleBulkConfig } from '@/lib/excel/bulkUpload/fleetConfigs';
import { vehicleExportConfig } from '@/lib/excel/bulkUpload/fleetExportConfigs';
import {
  formatTimestamp,
  isExpiringWithinOneMonthOrHasExpired,
} from '@/components/shared/utils';

export function VehicleListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.vehicles);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const vehicleBulkConfig = useMemo(() => createVehicleBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteVehicle(deleteTarget.id));
    if (deleteVehicle.fulfilled.match(result)) {
      toast.success('Vehicle deleted');
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const displayExpiryDate = (expiryDate: unknown) => {
    const isExpiringSoon = isExpiringWithinOneMonthOrHasExpired(expiryDate);
    const dateText = formatTimestamp(expiryDate);
    return (
      <span className={isExpiringSoon ? 'text-destructive' : ''}>
        {dateText}
      </span>
    );
  };

  const columns: Column<Vehicle>[] = [
    { key: 'vehicleNumber', header: 'Vehicle Number' },
    { key: 'vehicleType', header: 'Type' },
    // { key: 'fuelType', header: 'Fuel' },
    { key: 'location', header: 'Location' },
    // { key: 'vendor', header: 'Vendor' },
    {
      key: 'insuranceExpiryDate',
      header: 'Insurance Expiry',
      render: (v) => displayExpiryDate(v.insuranceExpiryDate),
    },
    {
      key: 'pucExpiryDate',
      header: 'PUC Expiry',
      render: (v) => displayExpiryDate(v.pucExpiryDate),
    },
    {
      key: 'gatePassExpiry',
      header: 'Gate Pass Expiry',
      render: (v) => displayExpiryDate(v.gatePassExpiry),
    },
    {
      key: 'taxExpiryDate',
      header: 'Tax Expiry',
      render: (v) => displayExpiryDate(v.taxExpiryDate),
    },
    {
      key: 'fitnessExpiry',
      header: 'Fitness Expiry',
      render: (v) => displayExpiryDate(v.fitnessExpiry),
    },
    {
      key: 'loadTestExpiry',
      header: 'Load Test Expiry',
      render: (v) => displayExpiryDate(v.loadTestExpiry),
    },
    {
      key: 'safetyExpiryDate',
      header: 'Safety Expiry',
      render: (v) => displayExpiryDate(v.safetyExpiryDate),
    },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage fleet vehicles"
        action={
          <div className="flex gap-2">
            <ExportExcelButton config={vehicleExportConfig} items={items} />
            <BulkUploadDialog
              config={vehicleBulkConfig}
              onSuccess={() => dispatch(fetchVehicles())}
            />
            <Button onClick={() => navigate('/fleet-manager/vehicles/new')}>
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No vehicles"
          description="Add your first vehicle to get started."
          action={
            <Button onClick={() => navigate('/fleet-manager/vehicles/new')}>
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKey="vehicleNumber"
          searchPlaceholder="Search by vehicle number..."
          actions={(vehicle) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/fleet-manager/vehicles/${vehicle.id}/edit`);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(vehicle);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
