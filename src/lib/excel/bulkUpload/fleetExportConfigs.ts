import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';
import type {
  Compliance,
  Consumable,
  FleetWorkOrder,
  FuelEntry,
  FuelPrice,
  Tool,
  ToolStoreManagement,
  Vehicle,
} from '@/types';

import type { MasterDataExportConfig } from './exportMasterData';
import { exportMasterDataToExcel } from './exportMasterData';
import { toDateSafe } from '@/components/shared/utils';
import {
  complianceBulkColumns,
  consumableBulkColumns,
  fleetWorkOrderBulkColumns,
  fuelEntryBulkColumns,
  toolAllotmentBulkColumns,
  toolBulkConfig,
  vehicleBulkColumns,
  type FleetVehicleContext,
  type FleetVehicleToolContext,
} from './fleetConfigs';

function formatTs(ts?: Timestamp | unknown): string {
  const date = toDateSafe(ts);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

function boolToYesNo(value?: boolean): string {
  if (value === undefined) return '';
  return value ? 'Yes' : 'No';
}

function str(value?: string | number | null): string {
  if (value == null) return '';
  return String(value);
}

export const vehicleExportConfig: MasterDataExportConfig<Vehicle> = {
  entityName: 'Vehicles',
  fileName: 'Fleet_Vehicles_Export.xlsx',
  columns: vehicleBulkColumns,
  mapItemToRow: (vehicle) => ({
    'Vehicle Number': vehicle.vehicleNumber,
    'Fuel Type': vehicle.fuelType,
    'Vehicle Type': str(vehicle.vehicleType),
    Location: str(vehicle.location),
    Vendor: str(vehicle.vendor),
    'Insurance Number': str(vehicle.insuranceNumber),
    'Insurance Expiry Date': formatTs(vehicle.insuranceExpiryDate),
    'Gate Pass Number': str(vehicle.gatePassNumber),
    'Gate Pass Expiry': formatTs(vehicle.gatePassExpiry),
    Tax: str(vehicle.tax),
    'Tax Expiry Date': formatTs(vehicle.taxExpiryDate),
    Fitness: str(vehicle.fitness),
    'Fitness Expiry': formatTs(vehicle.fitnessExpiry),
    'Load Test': str(vehicle.loadTest),
    'Load Test Expiry': formatTs(vehicle.loadTestExpiry),
    Safety: str(vehicle.safety),
    'Safety Expiry Date': formatTs(vehicle.safetyExpiryDate),
    PUC: str(vehicle.puc),
    'PUC Expiry Date': formatTs(vehicle.pucExpiryDate),
  }),
};

export const toolExportConfig: MasterDataExportConfig<Tool> = {
  entityName: 'Tools',
  fileName: 'Fleet_Tools_Export.xlsx',
  columns: toolBulkConfig.columns,
  mapItemToRow: (tool) => ({
    'Tool Name': tool.toolName,
    Quantity: str(tool.quantity),
    Price: str(tool.price),
  }),
};

export const consumableExportConfig: MasterDataExportConfig<
  Consumable,
  FleetVehicleContext
> = {
  entityName: 'Consumables',
  fileName: 'Fleet_Consumables_Export.xlsx',
  columns: consumableBulkColumns,
  mapItemToRow: (item) => ({
    'Vehicle Number': item.vehicleNumber,
    'Consumable Item': item.consumableItem,
    Quantity: str(item.quantity),
    Amount: str(item.amount),
    Date: formatTs(item.date),
  }),
};

export const fuelEntryExportConfig: MasterDataExportConfig<
  FuelEntry,
  FleetVehicleContext
> = {
  entityName: 'Fuel Entries',
  fileName: 'Fleet_Fuel_Entries_Export.xlsx',
  columns: fuelEntryBulkColumns,
  mapItemToRow: (entry) => ({
    'Vehicle Number': entry.vehicleNumber,
    'Fuel Type': entry.fuelType,
    'Fuel Quantity (Litres)': str(entry.fuelQuantity),
    Amount: str(entry.amount),
    'Meter Reading': entry.meterReading,
    Date: formatTs(entry.date),
  }),
};

export const fuelPriceExportConfig: MasterDataExportConfig<FuelPrice> = {
  entityName: 'Fuel Prices',
  fileName: 'Fleet_Fuel_Prices_Export.xlsx',
  columns: [
    { header: 'Fuel Type', required: true, example: 'diesel' },
    { header: 'Price Per Litre', required: true, example: '96.50' },
  ],
  mapItemToRow: (price) => ({
    'Fuel Type': price.fuelType,
    'Price Per Litre': str(price.price),
  }),
};

export const complianceExportConfig: MasterDataExportConfig<
  Compliance,
  FleetVehicleContext
> = {
  entityName: 'Compliance Entries',
  fileName: 'Fleet_Compliance_Export.xlsx',
  columns: complianceBulkColumns,
  mapItemToRow: (entry) => ({
    'Vehicle Number': entry.vehicleNumber,
    'Compliance Type': entry.compliance,
    Description: str(entry.complianceDesc),
    Amount: str(entry.amount),
    Date: formatTs(entry.date),
  }),
};

export const toolAllotmentExportConfig: MasterDataExportConfig<
  ToolStoreManagement,
  FleetVehicleToolContext
> = {
  entityName: 'Tool Allotments',
  fileName: 'Fleet_Tool_Allotments_Export.xlsx',
  columns: toolAllotmentBulkColumns,
  mapItemToRow: (allotment, ctx) => {
    const vehicle = ctx.vehicles.find((v) => v.id === allotment.vehicleId);
    return {
      'Vehicle Number': vehicle?.vehicleNumber ?? '',
      'Tool Name': allotment.tool,
      Quantity: str(allotment.quantity),
      'Date of Allotment': formatTs(allotment.dateOfAllotment),
      'Date of Return': formatTs(allotment.dateOfReturn),
    };
  },
};

export interface FleetWorkOrderExportRow {
  workOrderId: string;
  workOrderNumber: string;
  workDescription: string;
  workOrderValue: number;
  workOrderBalance: number;
  workOrderValidity: string;
  shiftStatus: boolean;
  units: string[];
  itemName: string;
  hsnNo: string;
  itemPrice: number;
  itemNumber: number;
}

export const fleetWorkOrderExportConfig: MasterDataExportConfig<FleetWorkOrderExportRow> =
  {
    entityName: 'Fleet Work Orders',
    fileName: 'Fleet_Work_Orders_Export.xlsx',
    columns: fleetWorkOrderBulkColumns,
    getItemId: (row) => row.workOrderId,
    mapItemToRow: (row) => ({
      'Work Order Number': row.workOrderNumber,
      'Work Description': row.workDescription,
      'Work Order Value': str(row.workOrderValue),
      'Work Order Balance': str(row.workOrderBalance),
      'Work Order Validity': row.workOrderValidity,
      'Shift Status': boolToYesNo(row.shiftStatus),
      Units: row.units.join(','),
      'Item Name': row.itemName,
      'HSN No': row.hsnNo,
      'Item Price': str(row.itemPrice),
      'Item Number': str(row.itemNumber),
    }),
  };

function toFleetWorkOrderExportRow(
  wo: FleetWorkOrder,
  item?: { itemName: string; hsnNo?: string; itemPrice: number; itemNumber: number },
): FleetWorkOrderExportRow {
  return {
    workOrderId: wo.id,
    workOrderNumber: wo.workOrderNumber,
    workDescription: wo.workDescription,
    workOrderValue: wo.workOrderValue,
    workOrderBalance: wo.workOrderBalance,
    workOrderValidity: formatTs(wo.workOrderValidity),
    shiftStatus: wo.shiftStatus,
    units: wo.units ?? [],
    itemName: item?.itemName ?? '',
    hsnNo: item?.hsnNo ?? '',
    itemPrice: item?.itemPrice ?? 0,
    itemNumber: item?.itemNumber ?? 0,
  };
}

export async function buildFleetWorkOrderExportRows(
  workOrders: FleetWorkOrder[],
): Promise<FleetWorkOrderExportRow[]> {
  const rows: FleetWorkOrderExportRow[] = [];

  for (const wo of workOrders) {
    const items = await fleetWorkOrderService.getItemsByWorkOrderId(wo.id);
    if (items.length === 0) {
      rows.push(toFleetWorkOrderExportRow(wo));
      continue;
    }
    for (const item of items) {
      rows.push(toFleetWorkOrderExportRow(wo, item));
    }
  }

  return rows;
}

export async function exportFleetWorkOrdersToExcel(
  workOrders: FleetWorkOrder[],
  options: { includeFirebaseId?: boolean } = {},
): Promise<void> {
  const rows = await buildFleetWorkOrderExportRows(workOrders);
  await exportMasterDataToExcel(rows, fleetWorkOrderExportConfig, null, options);
}
