import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Building2,
  MapPin,
  Briefcase,
  ClipboardList,
  CalendarCheck,
  Banknote,
  ArrowRight,
} from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchSites } from "@/store/slices/siteSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const employees = useAppSelector((state) => state.employees.items);
  const departments = useAppSelector((state) => state.departments.items);
  const sites = useAppSelector((state) => state.sites.items);
  const designations = useAppSelector((state) => state.designations.items);
  const workOrders = useAppSelector((state) => state.workOrders.items);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchSites());
    dispatch(fetchDesignations());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const activeEmployees = employees.filter((e) => e.workingStatus).length;

  const stats = [
    { title: "Total Employees", value: employees.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", href: "/employees" },
    { title: "Active Employees", value: activeEmployees, icon: UserCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", href: "/employees" },
    { title: "Departments", value: departments.length, icon: Building2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", href: "/departments" },
    { title: "Sites", value: sites.length, icon: MapPin, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", href: "/sites" },
    { title: "Designations", value: designations.length, icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950", href: "/designations" },
    { title: "Work Orders", value: workOrders.length, icon: ClipboardList, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950", href: "/work-orders" },
  ];

  const quickLinks = [
    { title: "Add Employee", description: "Register a new employee", icon: Users, href: "/employees/new" },
    { title: "Mark Attendance", description: "Record daily attendance", icon: CalendarCheck, href: "/attendance" },
    { title: "Process Wages", description: "Create wage records", icon: Banknote, href: "/wages/new" },
    { title: "Work Orders", description: "Manage work orders", icon: ClipboardList, href: "/work-orders" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your HR management system"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(stat.href)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Card
              key={link.title}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => navigate(link.href)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardTitle className="text-sm">{link.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
