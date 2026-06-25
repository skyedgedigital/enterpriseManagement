import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ClipboardCheck,
  Truck,
  FileText,
  Database,
  ShieldCheck,
  ArrowRight,
  Plus,
  Receipt,
} from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchFleetWorkOrders } from "@/store/slices/fleet-manager/workOrderSlice";
import { fetchFleetChalans } from "@/store/slices/fleet-manager/chalanSlice";
import { fetchVehicles } from "@/store/slices/fleet-manager/vehicleSlice";
import { fetchInvoices } from "@/store/slices/fleet-manager/invoiceSlice";
import { fetchConsumables } from "@/store/slices/fleet-manager/consumable";
import { fetchAllCompliances } from "@/store/slices/fleet-manager/compliancesSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export function FleetManagerDashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const workOrders = useAppSelector((state) => state.fleetWorkOrders.items);
  const chalans = useAppSelector((state) => state.fleetChalans.chalans);
  const vehicles = useAppSelector((state) => state.vehicles.items);
  const invoices = useAppSelector((state) => state.invoices.invoices);
  const consumables = useAppSelector((state) => state.consumables.items);
  const compliances = useAppSelector((state) => state.compliances.compliances);

  useEffect(() => {
    dispatch(fetchFleetWorkOrders());
    dispatch(fetchFleetChalans());
    dispatch(fetchVehicles());
    dispatch(fetchInvoices());
    dispatch(fetchConsumables());
    dispatch(fetchAllCompliances());
  }, [dispatch]);

  const stats = [
    { title: "Work Orders", value: workOrders.length, icon: ClipboardList, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950", href: "/fleet-manager/work-orders" },
    { title: "Chalans", value: chalans.length, icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", href: "/fleet-manager/chalans" },
    { title: "Vehicles", value: vehicles.length, icon: Truck, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", href: "/fleet-manager/vehicles" },
    { title: "Invoices", value: invoices.length, icon: FileText, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950", href: "/fleet-manager/invoices" },
    { title: "Consumables", value: consumables.length, icon: Database, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950", href: "/fleet-manager/consumables" },
    { title: "Compliance", value: compliances.length, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950", href: "/fleet-manager/compliance" },
  ];

  const quickLinks = [
    { title: "New Work Order", description: "Create a fleet work order", icon: Plus, href: "/fleet-manager/work-orders/new" },
    { title: "Manage Chalans", description: "Review and approve chalans", icon: ClipboardCheck, href: "/fleet-manager/chalans" },
    { title: "Create Invoice", description: "Generate a new invoice", icon: Receipt, href: "/fleet-manager/invoices/create" },
    { title: "Add Vehicle", description: "Register a new vehicle", icon: Truck, href: "/fleet-manager/vehicles/new" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your fleet management system"
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
