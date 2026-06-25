import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployees, deleteEmployee } from "@/store/slices/employeeSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchSites } from "@/store/slices/siteSlice";
import { fetchBanks } from "@/store/slices/bankSlice";
import { fetchEsiLocations } from "@/store/slices/esiLocationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import type { Employee } from "@/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { createEmployeeBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { employeeExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function EmployeeListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.employees);
  const departments = useAppSelector((state) => state.departments.items);
  const designations = useAppSelector((state) => state.designations.items);
  const sites = useAppSelector((state) => state.sites.items);
  const banks = useAppSelector((state) => state.banks.items);
  const esiLocations = useAppSelector((state) => state.esiLocations.items);
  const workOrders = useAppSelector((state) => state.workOrders.items);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const employeeBulkConfig = useMemo(() => createEmployeeBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    dispatch(fetchSites());
    dispatch(fetchBanks());
    dispatch(fetchEsiLocations());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const getDeptName = (id?: string) => departments.find((d) => d.id === id)?.name ?? "-";
  const getDesigName = (id?: string) => designations.find((d) => d.id === id)?.designation ?? "-";
  const getSiteName = (id?: string) => sites.find((s) => s.id === id)?.name ?? "-";

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteEmployee(deleteTarget.id));
    if (deleteEmployee.fulfilled.match(result)) {
      toast.success("Employee deleted");
      setDeleteTarget(null);
    } else {
      toast.error(result.payload as string);
    }
  };

  const columns: Column<Employee>[] = [
    { key: "code", header: "Code" },
    { key: "name", header: "Name", render: (e) => e.name || "-" },
    { key: "department", header: "Department", render: (e) => getDeptName(e.department) },
    { key: "designation", header: "Designation", render: (e) => getDesigName(e.designation) },
    { key: "site", header: "Site", render: (e) => getSiteName(e.site) },
    {
      key: "workingStatus",
      header: "Status",
      render: (e) => (
        <Badge variant={e.workingStatus ? "default" : "secondary"}>
          {e.workingStatus ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description={`${items.length} employee${items.length !== 1 ? "s" : ""} total`}
        action={
          <div className="flex gap-2">
            <ExportExcelButton
              config={employeeExportConfig}
              items={items}
              context={{
                departments,
                designations,
                sites,
                banks,
                esiLocations,
                workOrders,
              }}
            />
            <BulkUploadDialog
              config={employeeBulkConfig}
              context={{
                departments,
                designations,
                sites,
                banks,
                esiLocations,
                workOrders,
              }}
              onSuccess={() => dispatch(fetchEmployees())}
            />
            <Button onClick={() => navigate("/employees/new")}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No employees"
          description="Add your first employee to get started."
          action={
            <Button onClick={() => navigate("/employees/new")}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          }
        />
      ) : (
        <DataTable
          data={items}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search by name..."
          actions={(emp) => (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}/edit`); }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(emp); }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
      />
    </div>
  );
}
