import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ClipboardCheck,
  Truck,
  ArrowRight,
  Plus,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchFleetWorkOrders } from "@/store/slices/fleet-manager/workOrderSlice";
import { fetchFleetChalans } from "@/store/slices/fleet-manager/chalanSlice";
import { fetchVehicles } from "@/store/slices/fleet-manager/vehicleSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";

export function DriverDashboardPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const workOrders = useAppSelector((state) => state.fleetWorkOrders.items);
  const chalans = useAppSelector((state) => state.fleetChalans.chalans);
  const vehicles = useAppSelector((state) => state.vehicles.items);

  useEffect(() => {
    dispatch(fetchFleetWorkOrders());
    dispatch(fetchFleetChalans());
    dispatch(fetchVehicles());
  }, [dispatch]);

  const myChalans = user
    ? chalans.filter((c) => c.createdByUid === user.uid)
    : [];

  const stats = [
    { title: "Work Orders", value: workOrders.length, icon: ClipboardList, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950", href: "/driver/chalan" },
    { title: "My Chalans", value: myChalans.length, icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950", href: "/driver/chalan" },
    { title: "Vehicles", value: vehicles.length, icon: Truck, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950", href: "/driver/chalan" },
  ];

  const quickLinks = [
    { title: "Create Chalan", description: "Submit a new chalan", icon: Plus, href: "/driver/chalan" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your driver activities"
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
