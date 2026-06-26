import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Landmark,
  MapPin,
  ShieldCheck,
  ClipboardList,
  FileText,
  ChevronRight,
  Database,
  ClipboardCheck,
  Gift,
  ContactRound,
  Truck,
  Archive,
  Flame,
  BarChart2,
  Receipt,
  ChevronLeft,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useAppSelector } from '@/hooks/useAppSelector';
import { canAccessPath, getDefaultRoute } from '@/lib/rbac';
import { CONTRACTOR_NAME } from '@/lib/constants';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Dashboard', url: '/fleet-manager', icon: LayoutDashboard },
  { title: 'Dashboard', url: '/driver', icon: LayoutDashboard },
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
];

// Master Data items sorted alphabetically
const masterDataNav = [
  { title: 'Banks', url: '/banks', icon: Landmark },
  { title: 'Departments', url: '/departments', icon: Building2 },
  { title: 'Designations', url: '/designations', icon: Briefcase },
  { title: 'Employees', url: '/employees', icon: Users },
  { title: 'ESI Locations', url: '/esi-locations', icon: ShieldCheck },
  { title: 'Sites', url: '/sites', icon: MapPin },
  { title: 'Work Orders', url: '/work-orders', icon: ClipboardList },
];

const operationsNav = [
  { title: 'CLM', url: '/clm', icon: ClipboardCheck },
  { title: 'Bank Payments', url: '/bank-payments', icon: Landmark },
  { title: 'PF ESIC', url: '/pf-esic', icon: FileText },
  { title: 'Leave & Bonus', url: '/leave-bonus', icon: Gift },
  { title: 'Arrear', url: '/arrear', icon: FileText },
  { title: 'Full & Final', url: '/full-and-final', icon: FileText },
];

// Fleet Manager Nav

const fleetManagerNav = [
  {
    title: 'Work Orders',
    url: '/fleet-manager/work-orders',
    icon: ClipboardList,
  },
  {
    title: 'Chalans',
    url: '/fleet-manager/chalans',
    icon: ClipboardCheck,
  },
  {
    title: 'Invoices',
    url: '/fleet-manager/invoices',
    icon: FileText,
  },
  {
    title: 'Vehicles',
    url: '/fleet-manager/vehicles',
    icon: Truck,
  },
  {
    title: 'Vehicle Report',
    url: '/fleet-manager/vehicle-reports',
    icon: BarChart2,
  },
  {
    title: 'Consumables',
    url: '/fleet-manager/consumables',
    icon: Database,
  },
  {
    title: 'Compliance',
    url: '/fleet-manager/compliance',
    icon: ShieldCheck,
  },
];
const fuelManagementNav = [
  { title: 'Fuel Entries', url: '/fleet-manager/fuel-management/entries' },
  { title: 'Fuel Prices', url: '/fleet-manager/fuel-management/prices' },
];

const storeManagementNav = [
  {
    title: 'Tools',
    url: '/fleet-manager/store-management/tools',
  },
  {
    title: 'Allotments',
    url: '/fleet-manager/store-management/allotments',
  },
];

const driverNav = [
  {
    title: 'Create Chalan',
    url: '/driver/chalan',
    icon: ClipboardCheck,
  },
];

const adminNav = [
  {
    title: 'Invoices',
    url: '/admin/invoices',
    icon: Receipt,
  },
  {
    title: 'Departments',
    url: '/admin/departments',
    icon: Building2,
  },
  {
    title: 'Engineers',
    url: '/admin/engineers',
    icon: ContactRound,
  },
  {
    title: 'Work Orders',
    url: '/admin/work-orders',
    icon: ClipboardList,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
  },
];

function SidebarEdgeToggle() {
  const { state, toggleSidebar, isMobile } = useSidebar();
  if (isMobile) return null;

  const collapsed = state === 'collapsed';

  return (
    <Button
      type='button'
      variant='outline'
      size='icon'
      data-slot='sidebar-edge-toggle'
      aria-label='Toggle sidebar'
      onClick={toggleSidebar}
      className={cn('hidden size-6 md:inline-flex')}
    >
      {collapsed ? (
        <ChevronRight className='size-3.5' />
      ) : (
        <ChevronLeft className='size-3.5' />
      )}
    </Button>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { role, roleStatus } = useAppSelector((s) => s.auth);

  const allow = (url: string) => canAccessPath(role ?? null, roleStatus, url);

  const mainNavFiltered = mainNav.filter((item) => allow(item.url));
  const masterDataFiltered = masterDataNav.filter((item) => allow(item.url));
  const operationsFiltered = operationsNav.filter((item) => allow(item.url));
  const fleetManagerFiltered = fleetManagerNav.filter((item) =>
    allow(item.url),
  );
  const storeManagementFiltered = storeManagementNav.filter((item) =>
    allow(item.url),
  );
  const fuelManagementFiltered = fuelManagementNav.filter((item) =>
    allow(item.url),
  );
  const driverFiltered = driverNav.filter((item) => allow(item.url));
  const adminFiltered = adminNav.filter((item) => allow(item.url));

  const showFleetSection =
    fleetManagerFiltered.length > 0 ||
    storeManagementFiltered.length > 0 ||
    fuelManagementFiltered.length > 0;

  const homeHref = getDefaultRoute(role, roleStatus);

  const isActive = (url: string) => {
    if (url === '/') return location.pathname === '/';
    if (url === '/fleet-manager') return location.pathname === '/fleet-manager';
    if (url === '/driver') return location.pathname === '/driver';
    if (url === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='border-b px-4 py-4'>
        <Link to={homeHref} className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted'>
            <Users className='h-4 w-4 text-primary' />
          </div>
          <span className='text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden'>
            {CONTRACTOR_NAME}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {roleStatus === 'missing' && (
          <p className='text-muted-foreground px-4 py-2 text-xs'>
            Access pending. Ask an administrator to assign your role in
            Firestore.
          </p>
        )}

        {mainNavFiltered.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavFiltered.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {masterDataFiltered.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  defaultOpen={masterDataFiltered.some((item) =>
                    isActive(item.url),
                  )}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Database className='h-4 w-4' />
                        <span>Master Data</span>
                        <ChevronRight className='ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {masterDataFiltered.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(item.url)}
                            >
                              <Link to={item.url}>
                                <item.icon className='h-4 w-4' />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {operationsFiltered.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsFiltered.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showFleetSection && (
          <SidebarGroup>
            <SidebarGroupLabel>Fleet Manager</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {fleetManagerFiltered.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {storeManagementFiltered.length > 0 && (
                  <Collapsible
                    defaultOpen={storeManagementFiltered.some((item) =>
                      isActive(item.url),
                    )}
                    className='group/store'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Archive className='h-4 w-4' />
                          <span>Store Management</span>
                          <ChevronRight className='ml-auto h-4 w-4 transition-transform group-data-[state=open]/store:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {storeManagementFiltered.map((item) => (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(item.url)}
                              >
                                <Link to={item.url}>
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
                {fuelManagementFiltered.length > 0 && (
                  <Collapsible
                    defaultOpen={fuelManagementFiltered.some((item) =>
                      isActive(item.url),
                    )}
                    className='group/fuel'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Flame className='h-4 w-4' />
                          <span>Fuel Management</span>
                          <ChevronRight className='ml-auto h-4 w-4 transition-transform group-data-[state=open]/fuel:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {fuelManagementFiltered.map((item) => (
                            <SidebarMenuSubItem key={item.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(item.url)}
                              >
                                <Link to={item.url}>
                                  <span>{item.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {driverFiltered.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Driver</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {driverFiltered.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminFiltered.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminFiltered.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarEdgeToggle />
    </Sidebar>
  );
}
