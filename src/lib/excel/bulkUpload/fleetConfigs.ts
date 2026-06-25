import { parse } from "date-fns";
import { Timestamp } from "firebase/firestore";

import { FLEET_WO_UNIT_PRESETS } from "@/lib/fleet-manager/constants";
import {
  complianceSchema,
  consumableFormSchema,
  fuelEntrySchema,
  fuelPriceSchema,
  toolSchema,
  toolStoreManagementSchema,
  vehicleSchema,
} from "@/lib/fleet-manager/validators";
import { consumableService } from "@/services/fleet-manger/consumables.service";
import { complianceService } from "@/services/fleet-manger/compliances.service";
import {
  fuelEntryService,
  fuelPriceService,
} from "@/services/fleet-manger/fuelManagement.service";
import {
  toolService,
  toolStoreManagementService,
} from "@/services/fleet-manger/toolStoreManagement.service";
import { vehicleService } from "@/services/fleet-manger/vehicle.service";
import { fleetWorkOrderService } from "@/services/fleet-manger/workOrder.service";
import type {
  ComplianceType,
  Tool,
  Vehicle,
  VehicleFuelType,
} from "@/types";
import { COMPLIANCE_TYPES } from "@/types";
import type { FleetWorkOrderFormValues } from "@/lib/fleet-manager/validators";

import type { BulkUploadConfig, BulkUploadRowResult } from "./types";
import {
  findByName,
  findVehicleByNumber,
  isRowEmpty,
  parseFuelType,
  parseOptionalDate,
  parsePositiveNumber,
  parseRequiredBool,
  parseRequiredDate,
} from "./utils";

// ============================================================
// Shared context
// ============================================================

export interface FleetVehicleContext {
  vehicles: Vehicle[];
}

export interface FleetVehicleToolContext extends FleetVehicleContext {
  tools: Tool[];
}

// ============================================================
// Vehicle
// ============================================================

const vehicleDateFields = [
  "Insurance Expiry Date",
  "Gate Pass Expiry",
  "Tax Expiry Date",
  "Fitness Expiry",
  "Load Test Expiry",
  "Safety Expiry Date",
  "PUC Expiry Date",
] as const;

export const vehicleBulkColumns = [
  { header: "Vehicle Number", required: true, example: "MH12AB1234" },
  { header: "Fuel Type", required: true, example: "diesel", hint: "diesel or petrol" },
  { header: "Vehicle Type", required: false, example: "Truck" },
  { header: "Location", required: false, example: "Plant A" },
  { header: "Vendor", required: false, example: "ABC Transport" },
  { header: "Insurance Number", required: false, example: "INS123456" },
  { header: "Insurance Expiry Date", required: false, example: "2025-12-31", hint: "YYYY-MM-DD" },
  { header: "Gate Pass Number", required: false, example: "GP001" },
  { header: "Gate Pass Expiry", required: false, example: "2025-06-30", hint: "YYYY-MM-DD" },
  { header: "Tax", required: false, example: "TAX001" },
  { header: "Tax Expiry Date", required: false, example: "2025-03-31", hint: "YYYY-MM-DD" },
  { header: "Fitness", required: false, example: "FIT001" },
  { header: "Fitness Expiry", required: false, example: "2025-08-31", hint: "YYYY-MM-DD" },
  { header: "Load Test", required: false, example: "LT001" },
  { header: "Load Test Expiry", required: false, example: "2025-09-30", hint: "YYYY-MM-DD" },
  { header: "Safety", required: false, example: "SAF001" },
  { header: "Safety Expiry Date", required: false, example: "2025-10-31", hint: "YYYY-MM-DD" },
  { header: "PUC", required: false, example: "PUC001" },
  { header: "PUC Expiry Date", required: false, example: "2025-07-31", hint: "YYYY-MM-DD" },
];

function parseVehicleRow(
  row: Record<string, string>,
  rowIndex: number,
): BulkUploadRowResult<Omit<Vehicle, "id" | "createdAt" | "updatedAt">> {
  const result: BulkUploadRowResult<Omit<Vehicle, "id" | "createdAt" | "updatedAt">> = {
    rowIndex,
    errors: [],
  };
  if (isRowEmpty(row, vehicleBulkColumns)) return result;

  const fuelType = parseFuelType(row["Fuel Type"]);
  if (!row["Fuel Type"].trim()) {
    result.errors.push("Fuel Type is required");
  } else if (!fuelType) {
    result.errors.push("Fuel Type must be diesel or petrol");
  }

  for (const field of vehicleDateFields) {
    const raw = row[field]?.trim();
    if (raw && !parseOptionalDate(raw)) {
      result.errors.push(`${field} must be YYYY-MM-DD`);
    }
  }

  if (result.errors.length > 0) return result;

  const parsed = vehicleSchema.safeParse({
    vehicleNumber: row["Vehicle Number"],
    vehicleType: row["Vehicle Type"] || undefined,
    location: row["Location"] || undefined,
    vendor: row["Vendor"] || undefined,
    insuranceNumber: row["Insurance Number"] || undefined,
    insuranceExpiryDate: parseOptionalDate(row["Insurance Expiry Date"]),
    gatePassNumber: row["Gate Pass Number"] || undefined,
    gatePassExpiry: parseOptionalDate(row["Gate Pass Expiry"]),
    tax: row["Tax"] || undefined,
    taxExpiryDate: parseOptionalDate(row["Tax Expiry Date"]),
    fitness: row["Fitness"] || undefined,
    fitnessExpiry: parseOptionalDate(row["Fitness Expiry"]),
    loadTest: row["Load Test"] || undefined,
    loadTestExpiry: parseOptionalDate(row["Load Test Expiry"]),
    safety: row["Safety"] || undefined,
    safetyExpiryDate: parseOptionalDate(row["Safety Expiry Date"]),
    puc: row["PUC"] || undefined,
    pucExpiryDate: parseOptionalDate(row["PUC Expiry Date"]),
    fuelType: fuelType as VehicleFuelType,
  });

  if (!parsed.success) {
    result.errors.push(parsed.error.issues[0]?.message ?? "Invalid vehicle");
    return result;
  }

  const d = parsed.data;
  result.data = {
    vehicleNumber: d.vehicleNumber,
    fuelType: d.fuelType,
    vehicleType: d.vehicleType,
    location: d.location,
    vendor: d.vendor,
    insuranceNumber: d.insuranceNumber,
    insuranceExpiryDate: d.insuranceExpiryDate
      ? Timestamp.fromDate(d.insuranceExpiryDate)
      : undefined,
    gatePassNumber: d.gatePassNumber,
    gatePassExpiry: d.gatePassExpiry ? Timestamp.fromDate(d.gatePassExpiry) : undefined,
    tax: d.tax,
    taxExpiryDate: d.taxExpiryDate ? Timestamp.fromDate(d.taxExpiryDate) : undefined,
    fitness: d.fitness,
    fitnessExpiry: d.fitnessExpiry ? Timestamp.fromDate(d.fitnessExpiry) : undefined,
    loadTest: d.loadTest,
    loadTestExpiry: d.loadTestExpiry ? Timestamp.fromDate(d.loadTestExpiry) : undefined,
    safety: d.safety,
    safetyExpiryDate: d.safetyExpiryDate
      ? Timestamp.fromDate(d.safetyExpiryDate)
      : undefined,
    puc: d.puc,
    pucExpiryDate: d.pucExpiryDate ? Timestamp.fromDate(d.pucExpiryDate) : undefined,
  };
  return result;
}

export function createVehicleBulkConfig(): BulkUploadConfig<
  Omit<Vehicle, "id" | "createdAt" | "updatedAt">,
  null
> {
  return {
    entityName: "Vehicles",
    templateFileName: "Fleet_Vehicles_Bulk_Upload_Template.xlsx",
    columns: vehicleBulkColumns,
    validateRow: (row, rowIndex) => parseVehicleRow(row, rowIndex),
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await vehicleService.create(row);
          success += 1;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Failed to create vehicle");
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}

// ============================================================
// Tool
// ============================================================

export const toolBulkConfig: BulkUploadConfig<
  Omit<Tool, "id" | "createdAt" | "updatedAt">,
  null
> = {
  entityName: "Tools",
  templateFileName: "Fleet_Tools_Bulk_Upload_Template.xlsx",
  columns: [
    { header: "Tool Name", required: true, example: "Spanner Set" },
    { header: "Quantity", required: true, example: "10" },
    { header: "Price", required: true, example: "2500", hint: "Price in rupees" },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<Omit<Tool, "id" | "createdAt" | "updatedAt">> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, toolBulkConfig.columns)) return result;

    const parsed = toolSchema.safeParse({
      toolName: row["Tool Name"],
      quantity: row["Quantity"],
      price: row["Price"],
    });
    if (!parsed.success) {
      result.errors.push(parsed.error.issues[0]?.message ?? "Invalid tool");
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await toolService.create(row);
        success += 1;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Failed to create tool");
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Consumable
// ============================================================

export const consumableBulkColumns = [
  {
    header: "Vehicle Number",
    required: true,
    example: "MH12AB1234",
    hint: "Must match existing vehicle",
  },
  { header: "Consumable Item", required: true, example: "Engine Oil" },
  { header: "Quantity", required: true, example: "5" },
  { header: "Amount", required: true, example: "3500", hint: "Amount in rupees" },
  { header: "Date", required: true, example: "2024-06-15", hint: "YYYY-MM-DD" },
];

export function createConsumableBulkConfig(): BulkUploadConfig<
  Parameters<typeof consumableService.create>[0],
  FleetVehicleContext
> {
  return {
    entityName: "Consumables",
    templateFileName: "Fleet_Consumables_Bulk_Upload_Template.xlsx",
    columns: consumableBulkColumns,
    validateRow(row, rowIndex, ctx) {
      const result: BulkUploadRowResult<Parameters<typeof consumableService.create>[0]> = {
        rowIndex,
        errors: [],
      };
      if (isRowEmpty(row, consumableBulkColumns)) return result;

      const vehicle = findVehicleByNumber(ctx.vehicles, row["Vehicle Number"]);
      if (!vehicle) {
        result.errors.push(
          `Vehicle "${row["Vehicle Number"]}" not found. Add vehicle first.`,
        );
      }

      const parsed = consumableFormSchema.safeParse({
        vehicleNumber: vehicle?.vehicleNumber ?? row["Vehicle Number"],
        consumableItem: row["Consumable Item"],
        quantity: row["Quantity"],
        amount: row["Amount"],
        date: row["Date"],
      });
      if (!parsed.success) {
        result.errors.push(parsed.error.issues[0]?.message ?? "Invalid consumable");
        return result;
      }
      if (result.errors.length > 0) return result;
      result.data = parsed.data;
      return result;
    },
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await consumableService.create(row);
          success += 1;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Failed to create consumable");
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}

// ============================================================
// Fuel Entry
// ============================================================

export const fuelEntryBulkColumns = [
  {
    header: "Vehicle Number",
    required: true,
    example: "MH12AB1234",
    hint: "Must match existing vehicle",
  },
  { header: "Fuel Type", required: true, example: "diesel", hint: "diesel or petrol" },
  { header: "Fuel Quantity (Litres)", required: true, example: "45" },
  { header: "Amount", required: true, example: "4500", hint: "Amount in rupees" },
  { header: "Meter Reading", required: true, example: "12500" },
  { header: "Date", required: true, example: "2024-06-15", hint: "YYYY-MM-DD" },
];

export function createFuelEntryBulkConfig(): BulkUploadConfig<
  Omit<import("@/types").FuelEntry, "id" | "createdAt" | "updatedAt">,
  FleetVehicleContext
> {
  return {
    entityName: "Fuel Entries",
    templateFileName: "Fleet_Fuel_Entries_Bulk_Upload_Template.xlsx",
    columns: fuelEntryBulkColumns,
    validateRow(row, rowIndex, ctx) {
      type FuelPayload = Omit<
        import("@/types").FuelEntry,
        "id" | "createdAt" | "updatedAt"
      >;
      const result: BulkUploadRowResult<FuelPayload> = { rowIndex, errors: [] };
      if (isRowEmpty(row, fuelEntryBulkColumns)) return result;

      const vehicle = findVehicleByNumber(ctx.vehicles, row["Vehicle Number"]);
      if (!vehicle) {
        result.errors.push(
          `Vehicle "${row["Vehicle Number"]}" not found. Add vehicle first.`,
        );
      }

      const parsed = fuelEntrySchema.safeParse({
        vehicleId: vehicle?.id ?? "",
        fuelType: row["Fuel Type"].trim().toLowerCase(),
        fuelQuantity: row["Fuel Quantity (Litres)"],
        amount: row["Amount"],
        meterReading: row["Meter Reading"],
        date: row["Date"],
      });
      if (!parsed.success) {
        result.errors.push(parsed.error.issues[0]?.message ?? "Invalid fuel entry");
        return result;
      }
      if (result.errors.length > 0) return result;

      const parsedDate = parse(parsed.data.date, "yyyy-MM-dd", new Date());
      result.data = {
        vehicleId: vehicle!.id,
        vehicleNumber: vehicle!.vehicleNumber,
        fuelType: parsed.data.fuelType,
        fuelQuantity: parsed.data.fuelQuantity,
        amount: parsed.data.amount,
        meterReading: parsed.data.meterReading,
        date: Timestamp.fromDate(parsedDate),
      };
      return result;
    },
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await fuelEntryService.create(row);
          success += 1;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Failed to create fuel entry");
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}

// ============================================================
// Fuel Price
// ============================================================

export const fuelPriceBulkConfig: BulkUploadConfig<
  { fuelType: "petrol" | "diesel"; price: number },
  null
> = {
  entityName: "Fuel Prices",
  templateFileName: "Fleet_Fuel_Prices_Bulk_Upload_Template.xlsx",
  columns: [
    { header: "Fuel Type", required: true, example: "diesel", hint: "diesel or petrol" },
    { header: "Price Per Litre", required: true, example: "96.50" },
  ],
  validateRow(row, rowIndex) {
    const result: BulkUploadRowResult<{ fuelType: "petrol" | "diesel"; price: number }> = {
      rowIndex,
      errors: [],
    };
    if (isRowEmpty(row, fuelPriceBulkConfig.columns)) return result;

    const parsed = fuelPriceSchema.safeParse({
      fuelType: row["Fuel Type"].trim().toLowerCase(),
      price: row["Price Per Litre"],
    });
    if (!parsed.success) {
      result.errors.push(parsed.error.issues[0]?.message ?? "Invalid fuel price");
      return result;
    }
    result.data = parsed.data;
    return result;
  },
  async importRows(rows) {
    let success = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        await fuelPriceService.upsert(row.fuelType, row.price);
        success += 1;
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Failed to update fuel price");
      }
    }
    return { success, failed: rows.length - success, errors };
  },
};

// ============================================================
// Compliance
// ============================================================

export const complianceBulkColumns = [
  {
    header: "Vehicle Number",
    required: true,
    example: "MH12AB1234",
    hint: "Must match existing vehicle",
  },
  {
    header: "Compliance Type",
    required: true,
    example: "INSURANCE",
    hint: COMPLIANCE_TYPES.join(", "),
  },
  {
    header: "Description",
    required: false,
    example: "",
    hint: "Required when type is OTHER",
  },
  { header: "Amount", required: true, example: "15000" },
  { header: "Date", required: true, example: "2024-06-15", hint: "YYYY-MM-DD" },
];

export function createComplianceBulkConfig(): BulkUploadConfig<
  Omit<import("@/types").Compliance, "id" | "createdAt" | "updatedAt">,
  FleetVehicleContext
> {
  return {
    entityName: "Compliance Entries",
    templateFileName: "Fleet_Compliance_Bulk_Upload_Template.xlsx",
    columns: complianceBulkColumns,
    validateRow(row, rowIndex, ctx) {
      type Payload = Omit<
        import("@/types").Compliance,
        "id" | "createdAt" | "updatedAt"
      >;
      const result: BulkUploadRowResult<Payload> = { rowIndex, errors: [] };
      if (isRowEmpty(row, complianceBulkColumns)) return result;

      const vehicle = findVehicleByNumber(ctx.vehicles, row["Vehicle Number"]);
      if (!vehicle) {
        result.errors.push(
          `Vehicle "${row["Vehicle Number"]}" not found. Add vehicle first.`,
        );
      }

      const complianceRaw = row["Compliance Type"].trim().toUpperCase();
      const compliance = COMPLIANCE_TYPES.find((t) => t === complianceRaw);
      if (!compliance) {
        result.errors.push(
          `Compliance Type must be one of: ${COMPLIANCE_TYPES.join(", ")}`,
        );
      }

      const parsed = complianceSchema.safeParse({
        vehicleId: vehicle?.id ?? "",
        compliance: compliance as ComplianceType | undefined,
        complianceDesc: row["Description"] || undefined,
        amount: row["Amount"],
        date: row["Date"],
      });
      if (!parsed.success) {
        result.errors.push(parsed.error.issues[0]?.message ?? "Invalid compliance");
        return result;
      }
      if (result.errors.length > 0) return result;

      const parsedDate = parse(parsed.data.date, "yyyy-MM-dd", new Date());
      result.data = {
        vehicleId: vehicle!.id,
        vehicleNumber: vehicle!.vehicleNumber,
        compliance: parsed.data.compliance,
        complianceDesc: parsed.data.complianceDesc || "",
        amount: parsed.data.amount,
        date: Timestamp.fromDate(parsedDate),
      };
      return result;
    },
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await complianceService.create(row);
          success += 1;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Failed to create compliance");
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}

// ============================================================
// Tool Allotment
// ============================================================

export const toolAllotmentBulkColumns = [
  {
    header: "Vehicle Number",
    required: true,
    example: "MH12AB1234",
    hint: "Must match existing vehicle",
  },
  {
    header: "Tool Name",
    required: true,
    example: "Spanner Set",
    hint: "Must match existing tool",
  },
  { header: "Quantity", required: true, example: "2" },
  { header: "Date of Allotment", required: true, example: "2024-06-01", hint: "YYYY-MM-DD" },
  { header: "Date of Return", required: true, example: "2024-06-30", hint: "YYYY-MM-DD" },
];

export function createToolAllotmentBulkConfig(): BulkUploadConfig<
  Omit<import("@/types").ToolStoreManagement, "id" | "createdAt" | "updatedAt">,
  FleetVehicleToolContext
> {
  return {
    entityName: "Tool Allotments",
    templateFileName: "Fleet_Tool_Allotments_Bulk_Upload_Template.xlsx",
    columns: toolAllotmentBulkColumns,
    validateRow(row, rowIndex, ctx) {
      type Payload = Omit<
        import("@/types").ToolStoreManagement,
        "id" | "createdAt" | "updatedAt"
      >;
      const result: BulkUploadRowResult<Payload> = { rowIndex, errors: [] };
      if (isRowEmpty(row, toolAllotmentBulkColumns)) return result;

      const vehicle = findVehicleByNumber(ctx.vehicles, row["Vehicle Number"]);
      if (!vehicle) {
        result.errors.push(
          `Vehicle "${row["Vehicle Number"]}" not found. Add vehicle first.`,
        );
      }

      const tool = findByName(ctx.tools, row["Tool Name"], (t) => t.toolName);
      if (!tool) {
        result.errors.push(`Tool "${row["Tool Name"]}" not found. Add tool first.`);
      }

      const parsed = toolStoreManagementSchema.safeParse({
        vehicleId: vehicle?.id ?? "",
        toolId: tool?.id ?? "",
        quantity: row["Quantity"],
        dateOfAllotment: row["Date of Allotment"],
        dateOfReturn: row["Date of Return"],
      });
      if (!parsed.success) {
        result.errors.push(parsed.error.issues[0]?.message ?? "Invalid allotment");
        return result;
      }
      if (result.errors.length > 0) return result;

      result.data = {
        vehicleId: vehicle!.id,
        toolId: tool!.id,
        tool: tool!.toolName,
        quantity: parsed.data.quantity,
        dateOfAllotment: Timestamp.fromDate(
          parse(parsed.data.dateOfAllotment, "yyyy-MM-dd", new Date()),
        ),
        dateOfReturn: Timestamp.fromDate(
          parse(parsed.data.dateOfReturn, "yyyy-MM-dd", new Date()),
        ),
        status: "active",
      };
      return result;
    },
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          await toolStoreManagementService.create(row);
          success += 1;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "Failed to create allotment");
        }
      }
      return { success, failed: rows.length - success, errors };
    },
  };
}

// ============================================================
// Fleet Work Order (one row = one line item; group by WO number)
// ============================================================

export interface FleetWorkOrderBulkRow {
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

const fleetWoUnitHint = FLEET_WO_UNIT_PRESETS.map((p) => p.value).join(", ");

export const fleetWorkOrderBulkColumns = [
  { header: "Work Order Number", required: true, example: "FWO-2024-001" },
  { header: "Work Description", required: true, example: "Plant maintenance" },
  { header: "Work Order Value", required: true, example: "500000" },
  { header: "Work Order Balance", required: true, example: "500000" },
  { header: "Work Order Validity", required: true, example: "2024-12-31", hint: "YYYY-MM-DD" },
  { header: "Shift Status", required: false, example: "No", hint: "Yes or No" },
  {
    header: "Units",
    required: true,
    example: "hours,shift,days",
    hint: `Comma-separated: ${fleetWoUnitHint}, or custom unit names`,
  },
  { header: "Item Name", required: true, example: "Crane Service" },
  { header: "HSN No", required: true, example: "998599" },
  { header: "Item Price", required: true, example: "5000" },
  { header: "Item Number", required: true, example: "1" },
];

function parseUnits(raw: string): { units?: string[]; error?: string } {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return { error: "Units is required (comma-separated)" };
  }
  return { units: parts };
}

function validateFleetWorkOrderRow(
  row: Record<string, string>,
  rowIndex: number,
): BulkUploadRowResult<FleetWorkOrderBulkRow> {
  const result: BulkUploadRowResult<FleetWorkOrderBulkRow> = { rowIndex, errors: [] };
  if (isRowEmpty(row, fleetWorkOrderBulkColumns)) return result;

  const woNumber = row["Work Order Number"].trim();
  if (!woNumber) result.errors.push("Work Order Number is required");

  const workDescription = row["Work Description"].trim();
  if (!workDescription) result.errors.push("Work Description is required");

  const valueParsed = parsePositiveNumber(row["Work Order Value"], "Work Order Value");
  if (valueParsed.error) result.errors.push(valueParsed.error);

  const balanceParsed = parsePositiveNumber(
    row["Work Order Balance"],
    "Work Order Balance",
  );
  if (balanceParsed.error) result.errors.push(balanceParsed.error);

  const validityParsed = parseRequiredDate(row["Work Order Validity"], "Work Order Validity");
  if (validityParsed.error) result.errors.push(validityParsed.error);

  const unitsParsed = parseUnits(row["Units"]);
  if (unitsParsed.error) result.errors.push(unitsParsed.error);

  let shiftStatus = false;
  const shiftRaw = row["Shift Status"].trim();
  if (shiftRaw) {
    const parsed = parseRequiredBool(shiftRaw, "Shift Status");
    if (parsed.error) result.errors.push(parsed.error);
    else shiftStatus = parsed.value ?? false;
  }

  const itemName = row["Item Name"].trim();
  if (!itemName) result.errors.push("Item Name is required");

  const hsnNo = row["HSN No"].trim();
  if (!hsnNo) result.errors.push("HSN No is required");

  const itemPriceParsed = parsePositiveNumber(row["Item Price"], "Item Price");
  if (itemPriceParsed.error) result.errors.push(itemPriceParsed.error);

  const itemNumberParsed = parsePositiveNumber(row["Item Number"], "Item Number");
  if (itemNumberParsed.error) result.errors.push(itemNumberParsed.error);

  if (result.errors.length > 0) return result;

  result.data = {
    workOrderNumber: woNumber,
    workDescription,
    workOrderValue: valueParsed.value!,
    workOrderBalance: balanceParsed.value!,
    workOrderValidity: row["Work Order Validity"].trim(),
    shiftStatus,
    units: unitsParsed.units!,
    itemName,
    hsnNo,
    itemPrice: itemPriceParsed.value!,
    itemNumber: itemNumberParsed.value!,
  };
  return result;
}

export function createFleetWorkOrderBulkConfig(): BulkUploadConfig<
  FleetWorkOrderBulkRow,
  null
> {
  return {
    entityName: "Fleet Work Orders",
    templateFileName: "Fleet_Work_Orders_Bulk_Upload_Template.xlsx",
    columns: fleetWorkOrderBulkColumns,
    validateRow: (row, rowIndex) => validateFleetWorkOrderRow(row, rowIndex),
    async importRows(rows) {
      let success = 0;
      const errors: string[] = [];

      const groups = new Map<string, FleetWorkOrderBulkRow[]>();
      for (const row of rows) {
        const key = row.workOrderNumber.trim();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }

      for (const [woNumber, groupRows] of groups) {
        try {
          const first = groupRows[0];
          const headerMismatch = groupRows.some(
            (r) =>
              r.workDescription !== first.workDescription ||
              r.workOrderValue !== first.workOrderValue ||
              r.workOrderBalance !== first.workOrderBalance ||
              r.workOrderValidity !== first.workOrderValidity ||
              r.shiftStatus !== first.shiftStatus ||
              r.units.join(",") !== first.units.join(","),
          );
          if (headerMismatch) {
            errors.push(
              `Work order "${woNumber}": header fields must match across all rows for the same WO number`,
            );
            continue;
          }

          if (await fleetWorkOrderService.workOrderNumberExists(woNumber)) {
            errors.push(`Work order "${woNumber}" already exists`);
            continue;
          }

          const form: FleetWorkOrderFormValues = {
            workOrderNumber: woNumber,
            workDescription: first.workDescription,
            workOrderValue: first.workOrderValue,
            workOrderBalance: first.workOrderBalance,
            workOrderValidity: first.workOrderValidity,
            shiftStatus: first.shiftStatus,
            units: first.units,
            items: groupRows.map((r) => ({
              itemName: r.itemName,
              hsnNo: r.hsnNo,
              itemPrice: r.itemPrice,
              itemNumber: r.itemNumber,
            })),
          };

          await fleetWorkOrderService.createFleetWorkOrder(form);
          success += 1;
        } catch (err) {
          errors.push(
            err instanceof Error
              ? err.message
              : `Failed to create fleet work order "${woNumber}"`,
          );
        }
      }

      const failedGroups = groups.size - success;
      return {
        success,
        failed: failedGroups > 0 ? failedGroups : 0,
        errors,
      };
    },
  };
}
