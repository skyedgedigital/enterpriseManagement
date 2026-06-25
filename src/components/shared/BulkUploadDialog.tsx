import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { generateBulkUploadTemplate } from '@/lib/excel/bulkUpload/generateTemplate';
import {
  parseExcelFile,
  parseExcelWorkbook,
} from '@/lib/excel/bulkUpload/parseExcel';
import type {
  BulkUploadConfig,
  BulkUploadRowResult,
} from '@/lib/excel/bulkUpload/types';

interface BulkUploadDialogProps<T, C = null> {
  config: BulkUploadConfig<T, C>;
  context?: C;
  onSuccess?: () => void;
  buttonText?: string;
}

export function BulkUploadDialog<T, C = null>({
  config,
  context = null as C,
  onSuccess,
  buttonText = 'Bulk Upload',
}: BulkUploadDialogProps<T, C>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<BulkUploadRowResult<T>[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const validRows = parsedRows.filter((r) => r.data && r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);
  const hasParsed = parsedRows.length > 0;

  const resetState = () => {
    setFileName('');
    setParsedRows([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetState();
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await generateBulkUploadTemplate(
        config.entityName,
        config.templateFileName,
        config.columns,
        config.additionalSheets ?? [],
      );
      toast.success('Template downloaded');
    } catch {
      toast.error('Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setParsing(true);
    setFileName(file.name);
    try {
      let results: BulkUploadRowResult<T>[];

      if (config.validateWorkbook) {
        const workbook = await parseExcelWorkbook(file);
        results = config.validateWorkbook(workbook.sheets, context as C);
      } else {
        const rows = await parseExcelFile(file);
        results = rows.map((row, index) =>
          config.validateRow(row, index + 2, context as C),
        );
      }

      const meaningful = results.filter((r) => r.data || r.errors.length > 0);

      if (meaningful.length === 0) {
        toast.error(
          'No data rows found. Fill rows on the Data sheet (keep column headers unchanged).',
        );
        setParsedRows([]);
        return;
      }

      setParsedRows(meaningful);
      const valid = meaningful.filter(
        (r) => r.data && r.errors.length === 0,
      ).length;
      const invalid = meaningful.filter((r) => r.errors.length > 0).length;
      if (invalid > 0) {
        toast.warning(`${valid} valid, ${invalid} invalid row(s) found`);
      } else {
        toast.success(`${valid} row(s) ready to import`);
      }
    } catch {
      toast.error('Failed to read Excel file');
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const result = await config.importRows(
        validRows.map((r) => r.data as T),
        context as C,
      );

      if (result.success > 0) {
        toast.success(
          `${result.success} ${config.entityName.toLowerCase()} imported successfully`,
        );
        onSuccess?.();
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} record(s) failed to import`);
      }
      if (result.errors.length > 0 && result.success === 0) {
        toast.error(result.errors[0]);
      }

      if (result.success > 0) {
        handleOpenChange(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const previewColumns = config.columns.slice(0, 6);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant='outline'>
          <Upload className='h-4 w-4' />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Bulk Upload — {config.entityName}</DialogTitle>
          <DialogDescription>
            Download the Excel template, fill in your data, and upload the file
            to import multiple records at once.
            {config.additionalSheets && config.additionalSheets.length > 0 && (
              <>
                {' '}
                The template has multiple tabs: <strong>Data</strong> (flat
                fields)
                {config.additionalSheets.map((s) => (
                  <span key={s.sheetName}>
                    {' '}
                    + <strong>{s.sheetName}</strong>
                    {s.firebaseField ? ` (${s.firebaseField})` : ''}
                  </span>
                ))}
                .
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='rounded-lg border bg-muted/30 p-4 space-y-3'>
            <div className='flex items-center justify-between gap-2 flex-wrap'>
              <p className='text-sm font-medium'>
                Required Excel format (example row)
              </p>
              <Button
                type='button'
                variant='secondary'
                size='sm'
                onClick={() => void handleDownloadTemplate()}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <Download className='h-4 w-4' />
                )}
                Download Template
              </Button>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-xs border-collapse'>
                <thead>
                  <tr>
                    {previewColumns.map((col) => (
                      <th
                        key={col.header}
                        className='border bg-background px-2 py-1.5 text-left font-medium whitespace-nowrap'
                      >
                        {col.header}
                        {col.required && (
                          <span className='text-destructive ml-0.5'>*</span>
                        )}
                      </th>
                    ))}
                    {config.columns.length > previewColumns.length && (
                      <th className='border bg-background px-2 py-1.5 text-left font-medium'>
                        +{config.columns.length - previewColumns.length} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {previewColumns.map((col) => (
                      <td
                        key={col.header}
                        className='border px-2 py-1.5 text-muted-foreground whitespace-nowrap'
                      >
                        {col.example || '—'}
                      </td>
                    ))}
                    {config.columns.length > previewColumns.length && (
                      <td className='border px-2 py-1.5 text-muted-foreground'>
                        …
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className='text-xs text-muted-foreground'>
              Columns marked with * are required. Download the full template for
              all columns and instructions.
            </p>
          </div>

          <div className='space-y-2'>
            <input
              ref={inputRef}
              type='file'
              accept='.xlsx,.xls'
              onChange={(e) => void handleFileSelect(e)}
              className='hidden'
            />
            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={() => inputRef.current?.click()}
              disabled={parsing || importing}
            >
              {parsing ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <FileSpreadsheet className='h-4 w-4' />
              )}
              {fileName ? fileName : 'Select Excel file'}
            </Button>
          </div>

          {hasParsed && (
            <div className='rounded-lg border p-3 space-y-2'>
              <p className='text-sm font-medium'>Validation summary</p>
              <div className='flex gap-4 text-sm'>
                <span className='text-green-600 dark:text-green-400'>
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className='text-destructive'>
                    {invalidRows.length} invalid
                  </span>
                )}
              </div>
              {invalidRows.length > 0 && (
                <div className='max-h-32 overflow-y-auto space-y-1'>
                  {invalidRows.slice(0, 10).map((row) => (
                    <p key={row.rowIndex} className='text-xs text-destructive'>
                      Row {row.rowIndex}: {row.errors.join('; ')}
                    </p>
                  ))}
                  {invalidRows.length > 10 && (
                    <p className='text-xs text-muted-foreground'>
                      …and {invalidRows.length - 10} more error(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={() => void handleImport()}
            disabled={importing || validRows.length === 0}
          >
            {importing && <Loader2 className='h-4 w-4 animate-spin' />}
            Import {validRows.length > 0 ? `${validRows.length} record(s)` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
