import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  ContactRound,
  Users,
  FileText,
  ClipboardList,
  ArrowRight,
  Plus,
  Receipt,
} from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchAdminDepartments } from "@/store/slices/admin/adminDepartmentSlice";
import { fetchEngineers } from "@/store/slices/admin/adminEngineerSlice";
import { fetchUserRoles } from "@/store/slices/admin/adminUserSlice";
import { fetchInvoices } from "@/store/slices/fleet-manager/invoiceSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { fetchFleetWorkOrders } from "@/store/slices/fleet-manager/workOrderSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const departments = useAppSelector((state) => state.adminDepartments.items);
  const engineers = useAppSelector((state) => state.engineers.engineers);
  const users = useAppSelector((state) => state.adminUsers.items);
  const invoices = useAppSelector((state) => state.invoices.invoices);
  const hrWorkOrders = useAppSelector((state) => state.workOrders.items);
  const fleetWorkOrders = useAppSelector((state) => state.fleetWorkOrders.items);

  useEffect(() => {
    dispatch(fetchAdminDepartments());
    dispatch(fetchEngineers());
    dispatch(fetchUserRoles());
    dispatch(fetchInvoices());
    dispatch(fetchWorkOrders());
    dispatch(fetchFleetWorkOrders());
  }, [dispatch]);

  const stats = [
    { title: "Departments", value: departments.length, icon: Building2, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", href: "/admin/departments" },
    { title: "Engineers", value: engineers.length, icon: ContactRound, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", href: "/admin/engineers" },
    { title: "Users", value: users.length, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", href: "/admin/users" },
    { title: "Invoices", value: invoices.length, icon: FileText, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", href: "/admin/invoices" },
    { title: "HR Work Orders", value: hrWorkOrders.length, icon: ClipboardList, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950", href: "/admin/work-orders" },
    { title: "Fleet Work Orders", value: fleetWorkOrders.length, icon: ClipboardList, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950", href: "/admin/work-orders" },
  ];

  const quickLinks = [
    { title: "Add Department", description: "Create a new department", icon: Plus, href: "/admin/departments/new" },
    { title: "Add Engineer", description: "Register a new engineer", icon: Plus, href: "/admin/engineers/new" },
    { title: "Add User", description: "Create an app user", icon: Plus, href: "/admin/users/new" },
    { title: "View Invoices", description: "Review all invoices", icon: Receipt, href: "/admin/invoices" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your admin management system"
      />

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
