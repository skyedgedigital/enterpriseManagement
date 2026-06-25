import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchBanks, deleteBank } from "@/store/slices/bankSlice";
import type { Bank } from "@/types";
import { getBankDisplayName } from "@/lib/sanitize";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { BulkUploadDialog } from "@/components/shared/BulkUploadDialog";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { bankBulkConfig } from "@/lib/excel/bulkUpload/masterDataConfigs";
import { bankExportConfig } from "@/lib/excel/bulkUpload/masterDataExportConfigs";

export function BankPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.banks);
  const [deleteTarget, setDeleteTarget] = useState<Bank | null>(null);
  const [bankFilter, setBankFilter] = useState<string>("all");

  useEffect(() => { dispatch(fetchBanks()); }, [dispatch]);

  const bankCounts = useMemo(() => {
    const c: Record<string, number> = {};
    items.forEach((b) => {
      const k = b.name || "";
      c[k] = (c[k] || 0) + 1;
    });
    return c;
  }, [items]);

  const filteredBanks = useMemo(() => {
    if (bankFilter === "all") return items;
    return items.filter((b) => (b.name || "") === bankFilter);
  }, [items, bankFilter]);

  const sortedBanks = useMemo(() => [...filteredBanks].sort((a, b) => (a.name === b.name ? (a.branch || "").localeCompare(b.branch || "") : a.name.localeCompare(b.name))), [filteredBanks]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteBank(deleteTarget.id));
    if (deleteBank.fulfilled.match(result)) { toast.success("Bank deleted"); setDeleteTarget(null); }
    else toast.error(result.payload as string);
  };

  const columns: Column<Bank>[] = [
    { key: "name", header: "Bank Name", render: (b) => getBankDisplayName(b.name) },
    { key: "branch", header: "Branch" },
    { key: "ifsc", header: "IFSC Code" },
  ];

  if (loading && items.length === 0) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Banks" description={bankFilter === "all" ? `Manage bank details (${items.length} total)` : `${getBankDisplayName(bankFilter)} — ${filteredBanks.length} branch(es)`} action={
        <div className="flex gap-2">
          <ExportExcelButton config={bankExportConfig} items={sortedBanks} />
          <BulkUploadDialog config={bankBulkConfig} onSuccess={() => dispatch(fetchBanks())} />
          <Button onClick={() => navigate("/banks/new")}><Plus className="h-4 w-4" /> Add Bank</Button>
        </div>
      } />

      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Filter by bank</Label>
          <Select value={bankFilter} onValueChange={setBankFilter}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="All banks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All banks ({items.length})</SelectItem>
              {Object.entries(bankCounts)
                .sort(([a], [b]) => getBankDisplayName(a).localeCompare(getBankDisplayName(b)))
                .map(([key, count]) => (
                  <SelectItem key={key} value={key}>{getBankDisplayName(key)} ({count})</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState title="No banks" description="Add your first bank to get started." action={<Button onClick={() => navigate("/banks/new")}><Plus className="h-4 w-4" /> Add Bank</Button>} />
      ) : (
        <DataTable data={sortedBanks} columns={columns} searchKey="branch" searchPlaceholder="Search by branch or IFSC..." actions={(item) => (
          <>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); navigate(`/banks/${item.id}/edit`); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </>
        )} />
      )}

      <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loading} />
    </div>
  );
}
