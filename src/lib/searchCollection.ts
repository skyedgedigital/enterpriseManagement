import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  endAt,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { COLLECTIONS } from "@/lib/constants";
import { adminUserService, userRecordFromData } from "@/services/admin/user.service";
import { adminDepartmentService } from "@/services/admin/adminDepartment.service";
import { engineerService } from "@/services/admin/engineer.service";
import { bankService } from "@/services/bank.service";
import { departmentService } from "@/services/department.service";
import { designationService } from "@/services/designation.service";
import { employeeService } from "@/services/employee.service";
import { esiLocationService } from "@/services/esiLocation.service";
import { finalSettlementService } from "@/services/finalSettlement.service";
import { siteService } from "@/services/site.service";
import { wagesService } from "@/services/wages.service";
import { workOrderService } from "@/services/workOrder.service";
import { consumableService } from "@/services/fleet-manger/consumables.service";
import { invoiceService } from "@/services/fleet-manger/invoice.service";
import { toolService, toolStoreManagementService } from "@/services/fleet-manger/toolStoreManagement.service";
import { vehicleService } from "@/services/fleet-manger/vehicle.service";
import { fleetWorkOrderService } from "@/services/fleet-manger/workOrder.service";

export const SEARCH_LIMIT_PER_FIELD = 50;
const FIRESTORE_IN_LIMIT = 30;
const PREFIX_END = "\uf8ff";

export type SearchCollectionKey =
  | "employees"
  | "banks"
  | "users"
  | "workOrders"
  | "fleetWorkOrders"
  | "vehicles"
  | "consumables"
  | "tools"
  | "toolAllotments"
  | "invoices"
  | "departments"
  | "adminDepartments"
  | "sites"
  | "esiLocations"
  | "engineers"
  | "designations"
  | "wages"
  | "finalSettlements";

type DirectConfig = {
  kind: "direct";
  collectionName: string;
  fields: string[];
  mapDoc?: (snap: QueryDocumentSnapshot<DocumentData>) => { id: string } | null;
};

type ViaConfig = {
  kind: "via";
  collectionName: string;
  viaCollection: string;
  viaFields: string[];
  foreignKey: string;
};

type SearchConfig = DirectConfig | ViaConfig;

const SEARCH_CONFIG: Record<SearchCollectionKey, SearchConfig> = {
  employees: {
    kind: "direct",
    collectionName: COLLECTIONS.EMPLOYEES,
    fields: ["name", "code"],
  },
  banks: {
    kind: "direct",
    collectionName: COLLECTIONS.BANKS,
    fields: ["branch", "ifsc"],
  },
  users: {
    kind: "direct",
    collectionName: COLLECTIONS.USERS,
    fields: ["email", "name", "phone", "role"],
    mapDoc: (snap) => userRecordFromData(snap.id, snap.data()),
  },
  workOrders: {
    kind: "direct",
    collectionName: COLLECTIONS.WORK_ORDERS,
    fields: ["workOrderNumber"],
  },
  fleetWorkOrders: {
    kind: "direct",
    collectionName: COLLECTIONS.FLEET_WORK_ORDERS,
    fields: ["workOrderNumber"],
  },
  vehicles: {
    kind: "direct",
    collectionName: COLLECTIONS.VEHICLES,
    fields: ["vehicleNumber"],
  },
  consumables: {
    kind: "direct",
    collectionName: COLLECTIONS.CONSUMABLES,
    fields: ["vehicleNumber"],
  },
  tools: {
    kind: "direct",
    collectionName: COLLECTIONS.TOOLS,
    fields: ["toolName"],
  },
  toolAllotments: {
    kind: "direct",
    collectionName: COLLECTIONS.TOOL_STORE_MANAGEMENT,
    fields: ["tool"],
  },
  invoices: {
    kind: "direct",
    collectionName: COLLECTIONS.INVOICES,
    fields: ["invoiceNumber"],
  },
  departments: {
    kind: "direct",
    collectionName: COLLECTIONS.DEPARTMENTS,
    fields: ["name"],
  },
  adminDepartments: {
    kind: "direct",
    collectionName: COLLECTIONS.ADMIN_DEPARTMENTS,
    fields: ["name"],
  },
  sites: {
    kind: "direct",
    collectionName: COLLECTIONS.SITES,
    fields: ["name"],
  },
  esiLocations: {
    kind: "direct",
    collectionName: COLLECTIONS.ESI_LOCATIONS,
    fields: ["name"],
  },
  engineers: {
    kind: "direct",
    collectionName: COLLECTIONS.ENGINEERS,
    fields: ["name"],
  },
  designations: {
    kind: "direct",
    collectionName: COLLECTIONS.DESIGNATIONS,
    fields: ["designation"],
  },
  wages: {
    kind: "via",
    collectionName: COLLECTIONS.WAGES,
    viaCollection: COLLECTIONS.EMPLOYEES,
    viaFields: ["name", "code"],
    foreignKey: "employee",
  },
  finalSettlements: {
    kind: "via",
    collectionName: COLLECTIONS.FINAL_SETTLEMENTS,
    viaCollection: COLLECTIONS.EMPLOYEES,
    viaFields: ["name", "code"],
    foreignKey: "employee",
  },
};

function prefixVariants(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const lower = t.toLowerCase();
  const upper = t.toUpperCase();
  const titled = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  return [...new Set([t, lower, upper, titled])];
}

function defaultMapDoc(snap: QueryDocumentSnapshot<DocumentData>): { id: string } {
  return { id: snap.id, ...snap.data() };
}

function mergeById<T extends { id: string }>(docs: T[]): T[] {
  const map = new Map<string, T>();
  for (const d of docs) {
    if (!map.has(d.id)) map.set(d.id, d);
  }
  return [...map.values()];
}

async function prefixQuery(
  collectionName: string,
  field: string,
  prefix: string,
  mapDoc: (snap: QueryDocumentSnapshot<DocumentData>) => { id: string } | null,
): Promise<{ id: string }[]> {
  const colRef = collection(db, collectionName);
  const q = query(
    colRef,
    orderBy(field),
    startAt(prefix),
    endAt(prefix + PREFIX_END),
    limit(SEARCH_LIMIT_PER_FIELD),
  );
  const snapshot = await getDocs(q);
  const rows: { id: string }[] = [];
  for (const snap of snapshot.docs) {
    const mapped = mapDoc(snap);
    if (mapped) rows.push(mapped);
  }
  return rows;
}

async function searchFields(
  collectionName: string,
  fields: string[],
  text: string,
  mapDoc: (snap: QueryDocumentSnapshot<DocumentData>) => { id: string } | null,
): Promise<{ id: string }[]> {
  const prefixes = prefixVariants(text);
  const batches = fields.flatMap((field) =>
    prefixes.map((prefix) => prefixQuery(collectionName, field, prefix, mapDoc)),
  );
  const nested = await Promise.all(batches);
  return mergeById(nested.flat());
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function searchVia(config: ViaConfig, text: string): Promise<{ id: string }[]> {
  const related = await searchFields(
    config.viaCollection,
    config.viaFields,
    text,
    defaultMapDoc,
  );
  const ids = related.map((r) => r.id);
  if (ids.length === 0) return [];

  const colRef = collection(db, config.collectionName);
  const chunks = chunk(ids, FIRESTORE_IN_LIMIT);
  const nested = await Promise.all(
    chunks.map(async (idChunk) => {
      const q = query(colRef, where(config.foreignKey, "in", idChunk));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(defaultMapDoc);
    }),
  );
  return mergeById(nested.flat());
}

export async function searchCollection<T extends { id: string }>(
  key: SearchCollectionKey,
  text: string,
): Promise<T[]> {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const config = SEARCH_CONFIG[key];
  if (config.kind === "via") {
    return (await searchVia(config, trimmed)) as T[];
  }

  const mapDoc = config.mapDoc ?? defaultMapDoc;
  return (await searchFields(config.collectionName, config.fields, trimmed, mapDoc)) as T[];
}

const LOAD_ALL: Record<SearchCollectionKey, () => Promise<{ id: string }[]>> = {
  employees: () => employeeService.getAll(),
  banks: () => bankService.getAll(),
  users: () => adminUserService.getAll(),
  workOrders: () => workOrderService.getAll(),
  fleetWorkOrders: () => fleetWorkOrderService.getAll(),
  vehicles: () => vehicleService.getAll(),
  consumables: () => consumableService.getAll(),
  tools: () => toolService.getAll(),
  toolAllotments: () => toolStoreManagementService.getAll(),
  invoices: () => invoiceService.getAll(),
  departments: () => departmentService.getAll(),
  adminDepartments: () => adminDepartmentService.getAll(),
  sites: () => siteService.getAll(),
  esiLocations: () => esiLocationService.getAll(),
  engineers: () => engineerService.getAll(),
  designations: () => designationService.getAll(),
  wages: () => wagesService.getAll(),
  finalSettlements: () => finalSettlementService.getAll(),
};

export async function loadAllCollection<T extends { id: string }>(
  key: SearchCollectionKey,
): Promise<T[]> {
  return (await LOAD_ALL[key]()) as T[];
}
