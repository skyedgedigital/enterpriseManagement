import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchWages, deleteWages } from "@/store/slices/wagesSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { MONTHS } from "@/lib/constants";
import type { Wages } from "@/types";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { createWagesBulkConfig } from "@/lib/excel/bulkUpload/transactionBulkConfigs";

export function WagesListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading } = useAppSelector((state) => state.wages);
  const employees = useAppSelector((state) => state.employees.items);
  const designations = useAppSelector((state) => state.designations.items);
  const workOrders = useAppSelector((state) => state.workOrders.items);
  const [deleteTarget, setDeleteTarget] = useState<Wages | null>(null);

  const wagesBulkConfig = useMemo(() => createWagesBulkConfig(), []);

  useEffect(() => {
    dispatch(fetchWages());
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  const getEmpName = (id: string) => { const e = employees.find((x) => x.id === id); return e?.name || e?.code || id; };
  const getDesigName = (id: string) => designations.find((d) => d.id === id)?.designation ?? id;
  const getMonthLabel = (m: number) => MONTHS.find((x) => x.value === m)?.label ?? String(m);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteWages(deleteTarget.id));
    if (deleteWages.fulfilled.match(result)) { toast.success("Wages record deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<Wages>[] = [
    { key: "employee", header: "Employee", render: (w) => getEmpName(w.employee) },
    { key: "period", header: "Period", render: (w) => `${getMonthLabel(w.month)} ${w.year}` },
    { key: "designation", header: "Designation", render: (w) => getDesigName(w.designation), hideOnMobile: true },
    { key: "attendance", header: "Attendance", hideOnMobile: true },
    { key: "total", header: "Total", render: (w) => `₹${w.total.toLocaleString()}`, hideOnMobile: true },
    { key: "netAmountPaid", header: "Net Pay", render: (w) => `₹${w.netAmountPaid.toLocaleString()}` },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wages"
        description={`${items.length} wage record${items.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex gap-2">
            <BulkUploadDialog
              config={wagesBulkConfig}
              context={{ employees, designations, workOrders }}
              onSuccess={() => dispatch(fetchWages())}
            />
            <Button onClick={() => navigate("/wages/new")}><Plus className="h-4 w-4" /> Add Wages</Button>
          </div>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="No wage records" description="Create your first wages entry." action={<Button onClick={() => navigate("/wages/new")}><Plus className="h-4 w-4" /> Add Wages</Button>} />
      ) : (
        <DataTable data={items} columns={columns} searchKey="employee" searchPlaceholder="Search..."
          actions={(item) => (
            <>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/wages/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </>
          )}
        />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
