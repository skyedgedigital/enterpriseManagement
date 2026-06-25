import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  exportMasterDataToExcel,
  type MasterDataExportConfig,
} from "@/lib/excel/bulkUpload/exportMasterData";

interface ExportExcelButtonProps<T, C = null> {
  config: MasterDataExportConfig<T, C>;
  items: T[];
  context?: C;
  disabled?: boolean;
}

export function ExportExcelButton<T, C = null>({
  config,
  items,
  context = null as C,
  disabled = false,
}: ExportExcelButtonProps<T, C>) {
  const [open, setOpen] = useState(false);
  const [includeFirebaseId, setIncludeFirebaseId] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (items.length === 0) {
      toast.error(`No ${config.entityName.toLowerCase()} to export`);
      return;
    }

    setExporting(true);
    try {
      await exportMasterDataToExcel(items, config, context as C, {
        includeFirebaseId,
      });
      toast.success(
        `Exported ${items.length} ${config.entityName.toLowerCase()} record${items.length !== 1 ? "s" : ""}`,
      );
      setOpen(false);
    } catch {
      toast.error("Failed to export Excel file");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="excel"
          disabled={disabled || items.length === 0}
        >
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Export options</p>
            <p className="text-xs text-muted-foreground">
              Download {items.length} record{items.length !== 1 ? "s" : ""} as
              Excel (.xlsx).
            </p>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="include-firebase-id" className="text-sm font-normal">
              Include Firebase ID
            </Label>
            <Switch
              id="include-firebase-id"
              checked={includeFirebaseId}
              onCheckedChange={setIncludeFirebaseId}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, adds a &quot;Firebase ID&quot; column as the first
            column on every sheet.
          </p>
          <Button
            type="button"
            className="w-full"
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
