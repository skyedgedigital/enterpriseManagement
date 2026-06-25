import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/components/auth/LoginPage';
import { ProfilePage } from '@/components/auth/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FleetManagerDashboardPage } from '@/pages/FleetManagerDashboardPage';
import { DriverDashboardPage } from '@/pages/DriverDashboardPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';

// Master Data
import { DepartmentPage } from '@/components/master-data/departments/DepartmentPage';
import { DepartmentFormPage } from '@/components/master-data/departments/DepartmentFormPage';
import { DesignationPage } from '@/components/master-data/designations/DesignationPage';
import { DesignationFormPage } from '@/components/master-data/designations/DesignationFormPage';
import { BankPage } from '@/components/master-data/banks/BankPage';
import { BankFormPage } from '@/components/master-data/banks/BankFormPage';
import { SitePage } from '@/components/master-data/sites/SitePage';
import { SiteFormPage } from '@/components/master-data/sites/SiteFormPage';
import { EsiLocationPage } from '@/components/master-data/esiLocations/EsiLocationPage';
import { EsiLocationFormPage } from '@/components/master-data/esiLocations/EsiLocationFormPage';

// Employees
import { EmployeeListPage } from '@/components/employees/EmployeeListPage';
import { EmployeeFormPage } from '@/components/employees/EmployeeFormPage';
import { EmployeeDetailPage } from '@/components/employees/EmployeeDetailPage';

// Work Orders
import { WorkOrderListPage } from '@/components/work-orders/WorkOrderListPage';
import { WorkOrderFormPage } from '@/components/work-orders/WorkOrderFormPage';

// Attendance
import { AttendancePage } from '@/components/attendance/AttendancePage';

// CLM
import { CLMPage } from '@/components/clm/CLMPage';

// Bank Payments
import { BankPaymentsPage } from '@/components/bank-payments/BankPaymentsPage';

// PF ESIC
import { PfEsicPage } from '@/components/pf-esic/PfEsicPage';

// Leave & Bonus
import { LeaveBonusPage } from '@/components/leave-bonus/LeaveBonusPage';

// Arrear
import { ArrearPage } from '@/components/arrear/ArrearPage';

// Full & Final
import { FullAndFinalPage } from '@/components/full-and-final/FullAndFinalPage';

// Wages
import { WagesListPage } from '@/components/wages/WagesListPage';
import { WagesFormPage } from '@/components/wages/WagesFormPage';

// Final Settlements
import { FinalSettlementPage } from '@/components/final-settlements/FinalSettlementPage';

// Fleet Manager Work Orders
import { FleetWorkOrderListPage } from './components/fleet-manager/workorder/FleetWorkOrderListPage';

import { LoadingState } from '@/components/shared/LoadingState';
import { FleetWorkOrderFormPage } from './components/fleet-manager/workorder/FleetWorkOrderFormPage';
import { FleetWorkOrderEditPage } from './components/fleet-manager/workorder/FleetWorkOrderEditPage';
import { FleetChalanListPage } from './components/fleet-manager/chalans/FleetChalanListPage';
import { DriverCreateChalanForm } from './components/driver/chalan/DriverCreateChalanForm';
import { AdminDepartmentPage } from './components/admin/departments/AdminDepartmentPage';
import { AdminDepartmentFormPage } from './components/admin/departments/AdminDepartmentFormPage';
import { AdminEngineersPage } from './components/admin/engineers/AdminEngineerPage';
import { AdminEngineerFormPage } from './components/admin/engineers/AdminEngineerFormPage';
import { VehicleListPage } from './components/fleet-manager/vehicles/VehicleListPage';
import { VehicleFormPage } from './components/fleet-manager/vehicles/VehicleFormPage';
import { ConsumableListPage } from './components/fleet-manager/consumable/ConsumableListPage';
import { ConsumableFormPage } from './components/fleet-manager/consumable/ConsumableFormPage';
import { CreateInvoicePage } from './components/fleet-manager/invoices/CreateInvoicePage';
import { FleetInvoiceListPage } from './components/fleet-manager/invoices/FleetInvoiceListPage';
import { FleetInvoiceDetailPage } from './components/fleet-manager/invoices/FleetInvoiceDetailPage';
import { ToolListPage } from './components/fleet-manager/tools-store-management/ToolListPage';
import { ToolFormPage } from './components/fleet-manager/tools-store-management/ToolFormPage';
import { ToolAllotmentListPage } from './components/fleet-manager/tools-store-management/ToolAllotementListPage';
import { ToolAllotmentFormPage } from './components/fleet-manager/tools-store-management/ToolAllotementFormPage';
import { FuelEntriesListPage } from './components/fleet-manager/fuel-management/FleetFuelEntriesListPage';
import { FuelEntryFormPage } from './components/fleet-manager/fuel-management/FleetFuelEntryFormPage';
import { FuelPricesPage } from './components/fleet-manager/fuel-management/FleetFuelPricesPage';
import { ComplianceListPage } from './components/fleet-manager/compliances/FleetComplianceListPage';
import { ComplianceFormPage } from './components/fleet-manager/compliances/FleetComplianceFormPage';
import { FleetVehicleReportPage } from './components/fleet-manager/vehicle-report/FleetVehicelReportPage';
import AdminInvoiceListPage from './components/admin/invoices/AdminInvoiceListPage';
import { AdminWorkOrdersPage } from './components/admin/work-orders/AdminWorkOrderPage';
import { AdminUserPage } from './components/admin/users/AdminUserPage';
import { AdminUserFormPage } from './components/admin/users/AdminUserFormPage';
import { AdminUserEditPage } from './components/admin/users/AdminUserEditPage';

const App = () => {
  const { initialized, user, roleStatus } = useAuth();

  const authBusy =
    !initialized ||
    (Boolean(user) && roleStatus !== 'ready' && roleStatus !== 'missing');

  if (authBusy) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <LoadingState />
      </div>
    );
  }

  return (
    <Routes>
      <Route path='/login' element={<LoginPage />} />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path='profile' element={<ProfilePage />} />

        {/* Master Data - Departments */}
        <Route path='departments' element={<DepartmentPage />} />
        <Route path='departments/new' element={<DepartmentFormPage />} />
        <Route path='departments/:id/edit' element={<DepartmentFormPage />} />

        {/* Master Data - Designations */}
        <Route path='designations' element={<DesignationPage />} />
        <Route path='designations/new' element={<DesignationFormPage />} />
        <Route path='designations/:id/edit' element={<DesignationFormPage />} />

        {/* Master Data - Banks */}
        <Route path='banks' element={<BankPage />} />
        <Route path='banks/new' element={<BankFormPage />} />
        <Route path='banks/:id/edit' element={<BankFormPage />} />

        {/* Master Data - Sites */}
        <Route path='sites' element={<SitePage />} />
        <Route path='sites/new' element={<SiteFormPage />} />
        <Route path='sites/:id/edit' element={<SiteFormPage />} />

        {/* Master Data - ESI Locations */}
        <Route path='esi-locations' element={<EsiLocationPage />} />
        <Route path='esi-locations/new' element={<EsiLocationFormPage />} />
        <Route
          path='esi-locations/:id/edit'
          element={<EsiLocationFormPage />}
        />

        {/* Employees */}
        <Route path='employees' element={<EmployeeListPage />} />
        <Route path='employees/new' element={<EmployeeFormPage />} />
        <Route path='employees/:id' element={<EmployeeDetailPage />} />
        <Route path='employees/:id/edit' element={<EmployeeFormPage />} />

        {/* Work Orders */}
        <Route path='work-orders' element={<WorkOrderListPage />} />
        <Route path='work-orders/new' element={<WorkOrderFormPage />} />
        <Route path='work-orders/:id/edit' element={<WorkOrderFormPage />} />

        {/* Attendance */}
        <Route path='attendance' element={<AttendancePage />} />

        {/* CLM */}
        <Route path='clm' element={<CLMPage />} />

        {/* Bank Payments */}
        <Route path='bank-payments' element={<BankPaymentsPage />} />

        {/* PF ESIC */}
        <Route path='pf-esic' element={<PfEsicPage />} />

        {/* Leave & Bonus */}
        <Route path='leave-bonus' element={<LeaveBonusPage />} />

        {/* Arrear */}
        <Route path='arrear' element={<ArrearPage />} />

        {/* Full & Final */}
        <Route path='full-and-final' element={<FullAndFinalPage />} />

        {/* Wages */}
        <Route path='wages' element={<WagesListPage />} />
        <Route path='wages/new' element={<WagesFormPage />} />
        <Route path='wages/:id/edit' element={<WagesFormPage />} />

        {/* Final Settlements */}
        <Route path='final-settlements' element={<FinalSettlementPage />} />

        {/******************** FLEET MANAGER ********************/}

        <Route
          path='fleet-manager'
          element={<FleetManagerDashboardPage />}
        />

        {/*  Work Orders */}
        <Route
          path='fleet-manager/work-orders'
          element={<FleetWorkOrderListPage />}
        />
        <Route
          path='fleet-manager/work-orders/new'
          element={<FleetWorkOrderFormPage />}
        />
        <Route
          path='fleet-manager/work-orders/:id/edit'
          element={<FleetWorkOrderEditPage />}
        />

        {/* Chalans */}
        <Route path='fleet-manager/chalans' element={<FleetChalanListPage />} />

        {/* Invoices */}
        <Route
          path='fleet-manager/invoices'
          element={<FleetInvoiceListPage />}
        />
        <Route
          path='fleet-manager/invoices/:id'
          element={<FleetInvoiceDetailPage />}
        />
        <Route
          path='fleet-manager/invoices/create'
          element={<CreateInvoicePage />}
        />

        {/* Vehicles */}
        <Route path='fleet-manager/vehicles' element={<VehicleListPage />} />
        <Route
          path='fleet-manager/vehicles/new'
          element={<VehicleFormPage />}
        />
        <Route
          path='fleet-manager/vehicles/:id/edit'
          element={<VehicleFormPage />}
        />
        {/* Vehicle Reports */}
        <Route
          path='fleet-manager/vehicle-reports'
          element={<FleetVehicleReportPage />}
        />

        {/* consumables */}
        <Route
          path='fleet-manager/consumables'
          element={<ConsumableListPage />}
        />
        <Route
          path='fleet-manager/consumables/new'
          element={<ConsumableFormPage />}
        />
        <Route
          path='fleet-manager/consumables/:id/edit'
          element={<ConsumableFormPage />}
        />

        {/* Store Management - Tools */}
        <Route
          path='fleet-manager/store-management/tools'
          element={<ToolListPage />}
        />
        <Route
          path='fleet-manager/store-management/tools/new'
          element={<ToolFormPage />}
        />
        <Route
          path='fleet-manager/store-management/tools/:id/edit'
          element={<ToolFormPage />}
        />

        {/* Store Management - Allotments */}
        <Route
          path='fleet-manager/store-management/allotments'
          element={<ToolAllotmentListPage />}
        />
        <Route
          path='fleet-manager/store-management/allotments/new'
          element={<ToolAllotmentFormPage />}
        />

        {/* Fuel Management */}
        <Route
          path='fleet-manager/fuel-management/entries'
          element={<FuelEntriesListPage />}
        />
        <Route
          path='fleet-manager/fuel-management/entries/new'
          element={<FuelEntryFormPage />}
        />
        <Route
          path='fleet-manager/fuel-management/prices'
          element={<FuelPricesPage />}
        />
        <Route
          path='fleet-manager/compliance'
          element={<ComplianceListPage />}
        />
        <Route
          path='fleet-manager/compliance/new'
          element={<ComplianceFormPage />}
        />

        {/******************** DRIVER ********************/}

        <Route path='driver' element={<DriverDashboardPage />} />
        <Route path='driver/chalan' element={<DriverCreateChalanForm />} />

        {/******************** ADMIN ********************/}

        <Route path='admin' element={<AdminDashboardPage />} />

        {/* admin - Invoices */}
        <Route path='admin/invoices' element={<AdminInvoiceListPage />} />

        {/* admin - Departments */}
        <Route path='admin/departments' element={<AdminDepartmentPage />} />
        <Route
          path='admin/departments/new'
          element={<AdminDepartmentFormPage />}
        />
        <Route
          path='admin/departments/:id/edit'
          element={<AdminDepartmentFormPage />}
        />

        {/* Engineers */}
        <Route path='admin/engineers' element={<AdminEngineersPage />} />
        <Route path='admin/engineers/new' element={<AdminEngineerFormPage />} />
        <Route
          path='admin/engineers/:id/edit'
          element={<AdminEngineerFormPage />}
        />
        {/* admin - Work Orders */}
        <Route path='admin/work-orders' element={<AdminWorkOrdersPage />} />
        <Route path='admin/users' element={<AdminUserPage />} />
        <Route path='admin/users/new' element={<AdminUserFormPage />} />
        <Route path='admin/users/:id/edit' element={<AdminUserEditPage />} />
      </Route>

      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
};

export default App;
