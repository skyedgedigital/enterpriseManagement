export const ATTENDANCE_STATUSES = [
  'Present',
  'Absent',
  'Half Day',
  'NH',
  'Not Paid',
  'Earned Leave',
  'Casual Leave',
  'Festival Leave',
] as const;

/** Display labels for attendance dropdown (CLM/sheets). Value is stored in DB. */
export const ATTENDANCE_STATUS_DISPLAY: Record<
  (typeof ATTENDANCE_STATUSES)[number],
  string
> = {
  Present: 'Present',
  Absent: 'Absent',
  'Half Day': 'Half Day',
  NH: 'NH (National Holiday)',
  'Not Paid': 'Not Paid',
  'Earned Leave': 'EL (Earned Leave)',
  'Casual Leave': 'CL (Casual Leave)',
  'Festival Leave': 'FL (Festival Leave)',
};

export const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;

export const MARITAL_STATUS_OPTIONS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed',
] as const;

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

/**
 * National holidays (day of month, month 1-12) — pre-filled as NH in attendance.
 * 26 Jan, 15 Aug, 2 Oct, 1 May.
 */
export const NATIONAL_HOLIDAYS: { day: number; month: number }[] = [
  { day: 26, month: 1 },
  { day: 15, month: 8 },
  { day: 2, month: 10 },
  { day: 1, month: 5 },
];

/** Allowance labels for wages form (separate fields as per UI) */
export const WAGES_ALLOWANCE_LABELS = [
  'HRA for Workmen',
  'Monthly Mobile Allowance',
  'Monthly Incumbent Allowance',
  'Earned Other Cash',
  'Performance Bonus',
  'Washing Allowance',
  'Conveyance Allowance',
  'Medical Allowance',
  'Site Specific Allowance',
  'Other Allowance',
] as const;

/** Indian bank names for bank master data (select name, then add branch + IFSC) */
export const BANK_NAMES = [
  'Allahabad Bank',
  'Andhra Bank',
  'Axis Bank',
  'Bandhan Bank',
  'Bank of Baroda',
  'Bank of India',
  'Bank of Maharashtra',
  'Canara Bank',
  'Central Bank of India',
  'City Union Bank',
  'Federal Bank',
  'HDFC Bank',
  'ICICI Bank',
  'IDBI Bank',
  'IDFC First Bank',
  'Indian Bank',
  'Indian Overseas Bank',
  'IndusInd Bank',
  'Jammu & Kashmir Bank',
  'Karnataka Bank',
  'Karur Vysya Bank',
  'Kotak Mahindra Bank',
  'Punjab & Sind Bank',
  'Punjab National Bank',
  'RBL Bank',
  'South Indian Bank',
  'State Bank of India',
  'Tamilnad Mercantile Bank',
  'UCO Bank',
  'Union Bank of India',
  'Utkarsh Small Finance Bank',
  'Yes Bank',
] as const;

/** Indian states and union territories (full names) for work order state filter/group */
export const INDIAN_STATES_AND_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
] as const;

export const COLLECTIONS = {
  USERS: 'users',

  // HR
  EMPLOYEES: 'employees',
  DEPARTMENTS: 'departments',
  DESIGNATIONS: 'designations',
  BANKS: 'banks',
  SITES: 'sites',
  ESI_LOCATIONS: 'esiLocations',
  WORK_ORDERS: 'workOrders',
  ATTENDANCES: 'attendances',
  WAGES: 'wages',
  FINAL_SETTLEMENTS: 'finalSettlements',
  COUNTERS: 'counters',

  // FLEET-MANAGER
  FLEET_WORK_ORDER_ITEMS: 'fleetWorkOrderItems',
  FLEET_WORK_ORDERS: 'fleetWorkOrders',
  CHALANS: 'chalans',
  INVOICES: 'invoices',
  VEHICLES: 'vehicles',
  CONSUMABLES: 'consumables',
  TOOLS: 'tools',
  TOOL_STORE_MANAGEMENT: 'toolStoreManagement',
  FUEL_ENTRIES: 'fuelEntries',
  FUEL_PRICES: 'fuelPrices',
  COMPLIANCES: 'compliances',

  // ADMIN
  ADMIN_DEPARTMENTS: 'adminDepartments',
  ENGINEERS: 'engineers',
  ENTERPRISE_DETAILS: 'enterpriseDetails',
} as const;

/** Employee code prefix and digit length (e.g. EMP0001) */
export const EMPLOYEE_CODE_PREFIX = 'EMP';
export const EMPLOYEE_CODE_DIGITS = 4;

/** Contractor details shown on all CLM PDF forms (FORM XIX, XVI, etc.) */
export const CONTRACTOR_NAME =
  import.meta.env.VITE_CONTRACTOR_NAME || 'Enterprise Management';
export const CONTRACTOR_ADDRESS = import.meta.env.VITE_COMPANY_ADDRESS || '';
export const CONTRACTOR_VENDOR_CODE =
  import.meta.env.VITE_CONTRACTOR_VENDOR_CODE || '';
export const CONTRACTOR_EMAIL = import.meta.env.VITE_CONTRACTOR_EMAIL || '';
export const CONTRACTOR_PAN = import.meta.env.VITE_CONTRACTOR_PAN || '';
export const CONTRACTOR_GSTIN = import.meta.env.VITE_CONTRACTOR_GSTIN || '';

/** Bonus register checklist PDF/Excel header (left column, lines 2–3). Edit to match your letterhead. */
export const CONTRACTOR_BONUS_OFFICE_LINE = `Office Add.-${CONTRACTOR_ADDRESS}`;
export const CONTRACTOR_BONUS_CORRESPONDING_LINE = import.meta.env
  .VITE_CONTRACTOR_BONUS_CORRESPONDING_LINE;
/**
 * Muster roll / leave checklist — right header (contractor & principal employer).
 * Edit to match your establishment (see statutory form).
 */
export const LEAVE_MUSTER_CONTRACTOR_PARTY_TEXT = 'XLRI';
export const LEAVE_MUSTER_PRINCIPAL_EMPLOYER_TEXT = 'XLRI';
