import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import {
  exportFleetWorkOrdersToExcel,
  fleetWorkOrderExportConfig,
} from '@/lib/excel/bulkUpload/fleetExportConfigs';
import type { FleetWorkOrder } from '@/types';

interface FleetWorkOrderExportButtonProps {
  workOrders: FleetWorkOrder[];
  disabled?: boolean;
}

export function FleetWorkOrderExportButton({
  workOrders,
  disabled = false,
}: FleetWorkOrderExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [includeFirebaseId, setIncludeFirebaseId] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (workOrders.length === 0) {
      toast.error(`No ${fleetWorkOrderExportConfig.entityName.toLowerCase()} to export`);
      return;
    }

    setExporting(true);
    try {
      await exportFleetWorkOrdersToExcel(workOrders, { includeFirebaseId });
      toast.success(
        `Exported ${workOrders.length} ${fleetWorkOrderExportConfig.entityName.toLowerCase()} record${workOrders.length !== 1 ? 's' : ''}`,
      );
      setOpen(false);
    } catch {
      toast.error('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='excel'
          disabled={disabled || workOrders.length === 0}
        >
          <Download className='h-4 w-4' />
          Export Excel
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72' align='end'>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <p className='text-sm font-medium'>Export options</p>
            <p className='text-xs text-muted-foreground'>
              Download {workOrders.length} work order
              {workOrders.length !== 1 ? 's' : ''} with line items as Excel
              (.xlsx).
            </p>
          </div>
          <div className='flex items-center justify-between gap-3'>
            <Label htmlFor='fleet-wo-include-firebase-id' className='text-sm font-normal'>
              Include Firebase ID
            </Label>
            <Switch
              id='fleet-wo-include-firebase-id'
              checked={includeFirebaseId}
              onCheckedChange={setIncludeFirebaseId}
            />
          </div>
          <p className='text-xs text-muted-foreground'>
            When enabled, adds a &quot;Firebase ID&quot; column as the first
            column on every sheet.
          </p>
          <Button
            type='button'
            className='w-full'
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Download className='h-4 w-4' />
            )}
            Download
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
