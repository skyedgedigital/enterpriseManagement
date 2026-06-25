import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import departmentReducer from './slices/departmentSlice';
import designationReducer from './slices/designationSlice';
import bankReducer from './slices/bankSlice';
import siteReducer from './slices/siteSlice';
import esiLocationReducer from './slices/esiLocationSlice';
import employeeReducer from './slices/employeeSlice';
import workOrderReducer from './slices/workOrderSlice';
import attendanceReducer from './slices/attendanceSlice';
import wagesReducer from './slices/wagesSlice';
import finalSettlementReducer from './slices/finalSettlementSlice';
import fleetWorkOrderReducer from './slices/fleet-manager/workOrderSlice';
import fleetChalanReducer from './slices/fleet-manager/chalanSlice';
import adminDepartmentReducer from './slices/admin/adminDepartmentSlice';
import engineerReducer from './slices/admin/adminEngineerSlice';
import adminUserReducer from './slices/admin/adminUserSlice';
import vehicleReducer from './slices/fleet-manager/vehicleSlice';
import consumableReducer from './slices/fleet-manager/consumable';
import invoiceReducer from './slices/fleet-manager/invoiceSlice';
import toolsReducer from './slices/fleet-manager/toolStoreManagementSlice';
import { toolStoreManagementReducer } from './slices/fleet-manager/toolStoreManagementSlice';
import complianceReducer from './slices/fleet-manager/compliancesSlice';
import {
  fuelEntryReducer,
  fuelPriceReducer,
} from './slices/fleet-manager/fuelManagementSlice';
import vehicleReportReducer from './slices/fleet-manager/vehicleReportSlice';
export const store = configureStore({
  reducer: {
    // AUTH
    auth: authReducer,

    // HR
    departments: departmentReducer,
    designations: designationReducer,
    banks: bankReducer,
    sites: siteReducer,
    esiLocations: esiLocationReducer,
    employees: employeeReducer,
    workOrders: workOrderReducer,
    attendances: attendanceReducer,
    wages: wagesReducer,

    // FLEET MANAGER
    finalSettlements: finalSettlementReducer,
    fleetWorkOrders: fleetWorkOrderReducer,
    fleetChalans: fleetChalanReducer,
    vehicles: vehicleReducer,
    vehicleReports: vehicleReportReducer,
    consumables: consumableReducer,
    invoices: invoiceReducer,
    tools: toolsReducer,
    toolStoreManagement: toolStoreManagementReducer,
    fuelEntries: fuelEntryReducer,
    fuelPrices: fuelPriceReducer,
    compliances: complianceReducer,

    // ADMIN
    adminDepartments: adminDepartmentReducer,
    engineers: engineerReducer,
    adminUsers: adminUserReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser', 'auth/loginUser/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
