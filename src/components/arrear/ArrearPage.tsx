import { useEffect, useState, useCallback } from 'react';
import { createElement } from 'react';
import { toast } from 'sonner';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { fetchWorkOrders } from '@/store/slices/workOrderSlice';
import { fetchEmployees } from '@/store/slices/employeeSlice';
import { fetchDesignations } from '@/store/slices/designationSlice';
import { fetchWages } from '@/store/slices/wagesSlice';
import { fetchAttendances } from '@/store/slices/attendanceSlice';
import { fetchDepartments } from '@/store/slices/departmentSlice';
import { fetchBanks } from '@/store/slices/bankSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  buildArrearData,
  generateArrearPDF,
  type GenerateArrearParams,
} from '@/lib/generateArrear';
import { generateArrearExcel } from '@/lib/excel/generateArrearExcel';
import { buildArrearPFReport } from '@/lib/generateArrearPFReport';
import { buildArrearESICReport } from '@/lib/generateArrearESICReport';
import { buildArrearBankStatementData } from '@/lib/generateArrearBankReport';
import { PFReportPDF } from '@/components/pdf/PFReportPDF';
import { ESICReportPDF } from '@/components/pdf/ESICReportPDF';
import { BankStatementPTAPDF } from '@/components/pdf/BankStatementPTAPDF';
import { generatePFReportExcel } from '@/lib/excel/generatePFReportExcel';
import { generateESICReportExcel } from '@/lib/excel/generateESICReportExcel';
import { generateBankStatementPTAExcel } from '@/lib/excel/generateBankStatementPTAExcel';
import { openPDFInNewTab } from '@/lib/pdfUtils';
import { INDIAN_STATES_AND_UTS } from '@/lib/constants';
import InfoStripe from '../shared/InfoStripe';

function parseDateToMonthYear(
  dateStr: string,
): { month: number; year: number } | null {
  if (!dateStr) return null;
  const [yearStr, monthStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return null;
  return { year, month };
}

export function ArrearPage() {
  const dispatch = useAppDispatch();
  const workOrders = useAppSelector((s) => s.workOrders.items);
  const employees = useAppSelector((s) => s.employees.items);
  const designations = useAppSelector((s) => s.designations.items);
  const wages = useAppSelector((s) => s.wages.items);
  const attendances = useAppSelector((s) => s.attendances.items);
  const departments = useAppSelector((s) => s.departments.items);
  const banks = useAppSelector((s) => s.banks.items);

  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [workOrderId, setWorkOrderId] = useState<string>('');
  const [arrearType, setArrearType] = useState<'DA'>('DA');
  const [location, setLocation] = useState('');
  const [employer, setEmployer] = useState('');

  // Filters for arrear PF / ESIC / Bank Statement reports
  const [pfDepartmentId, setPfDepartmentId] = useState<string>('');
  const [esicState, setEsicState] = useState<string>('');
  const [bankDepartmentId, setBankDepartmentId] = useState<string>('');

  const [pfGenerating, setPfGenerating] = useState(false);
  const [esicGenerating, setEsicGenerating] = useState(false);
  const [bankGenerating, setBankGenerating] = useState(false);

  useEffect(() => {
    dispatch(fetchWorkOrders());
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
    dispatch(fetchWages());
    dispatch(fetchAttendances());
    dispatch(fetchDepartments());
    dispatch(fetchBanks());
  }, [dispatch]);

  const buildParams = useCallback((): GenerateArrearParams | null => {
    const from = parseDateToMonthYear(fromDate);
    const to = parseDateToMonthYear(toDate);
    if (!from || !to) {
      toast.error('Please select both From and To dates');
      return null;
    }
    if (
      from.year > to.year ||
      (from.year === to.year && from.month > to.month)
    ) {
      toast.error('From date must be before To date');
      return null;
    }
    if (employees.length === 0) {
      toast.error('No employee data loaded. Please wait for data to load.');
      return null;
    }
    return {
      employees,
      wages,
      attendances,
      workOrders,
      designations,
      workOrderId,
      fromMonth: from.month,
      fromYear: from.year,
      toMonth: to.month,
      toYear: to.year,
      location,
      employer,
    };
  }, [
    fromDate,
    toDate,
    workOrderId,
    employees,
    wages,
    attendances,
    workOrders,
    designations,
    location,
    employer,
  ]);

  const handleGeneratePDF = async () => {
    const params = buildParams();
    if (!params) return;
    const data = buildArrearData(params);
    if (data.rows.length === 0) {
      toast.error(
        'No arrear records found for the selected period. Check date range, attendance records, and designation rates.',
      );
      return;
    }
    try {
      await generateArrearPDF(params);
    } catch {
      toast.error('Failed to generate PDF');
    }
  };

  const handleGenerateExcel = async () => {
    const params = buildParams();
    if (!params) return;
    const data = buildArrearData(params);
    if (data.rows.length === 0) {
      toast.error(
        'No arrear records found for the selected period. Check date range, attendance records, and designation rates.',
      );
      return;
    }
    try {
      await generateArrearExcel(data);
    } catch {
      toast.error('Failed to generate Excel');
    }
  };

  const handleGenerateArrearPF = async () => {
    const params = buildParams();
    if (!params) return;
    setPfGenerating(true);
    try {
      const rows = buildArrearPFReport({
        ...params,
        departmentId: pfDepartmentId || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          'No arrear PF data for the selected period and department. Check date range, designation rates, and PF opt-out flags.',
        );
        return;
      }
      const departmentName = pfDepartmentId
        ? departments.find((d) => d.id === pfDepartmentId)?.name
        : undefined;
      await openPDFInNewTab(
        createElement(PFReportPDF, {
          rows,
          year: params.toYear,
          month: params.toMonth,
          departmentName,
        }),
      );
      toast.success('Arrear PF report PDF generated.');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to generate arrear PF PDF',
      );
    } finally {
      setPfGenerating(false);
    }
  };

  const handleGenerateArrearPFExcel = async () => {
    const params = buildParams();
    if (!params) return;
    setPfGenerating(true);
    try {
      const rows = buildArrearPFReport({
        ...params,
        departmentId: pfDepartmentId || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          'No arrear PF data for the selected period and department. Check date range, designation rates, and PF opt-out flags.',
        );
        return;
      }
      const departmentName = pfDepartmentId
        ? departments.find((d) => d.id === pfDepartmentId)?.name
        : undefined;
      await generatePFReportExcel({
        rows,
        year: params.toYear,
        month: params.toMonth,
        departmentName,
      });
      toast.success('Arrear PF report Excel generated.');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to generate arrear PF Excel',
      );
    } finally {
      setPfGenerating(false);
    }
  };

  const handleGenerateArrearESIC = async () => {
    const params = buildParams();
    if (!params) return;
    setEsicGenerating(true);
    try {
      const rows = buildArrearESICReport({
        ...params,
        state: esicState || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          'No arrear ESIC data for the selected period and state. Check date range, designation rates, work-order state, and ESIC opt-out flags.',
        );
        return;
      }
      await openPDFInNewTab(
        createElement(ESICReportPDF, {
          rows,
          year: params.toYear,
          month: params.toMonth,
          stateName: esicState || undefined,
        }),
      );
      toast.success('Arrear ESIC report PDF generated.');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to generate arrear ESIC PDF',
      );
    } finally {
      setEsicGenerating(false);
    }
  };

  const handleGenerateArrearESICExcel = async () => {
    const params = buildParams();
    if (!params) return;
    setEsicGenerating(true);
    try {
      const rows = buildArrearESICReport({
        ...params,
        state: esicState || undefined,
      });
      if (rows.length === 0) {
        toast.warning(
          'No arrear ESIC data for the selected period and state. Check date range, designation rates, work-order state, and ESIC opt-out flags.',
        );
        return;
      }
      await generateESICReportExcel({
        rows,
        year: params.toYear,
        month: params.toMonth,
        stateName: esicState || undefined,
      });
      toast.success('Arrear ESIC report Excel generated.');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to generate arrear ESIC Excel',
      );
    } finally {
      setEsicGenerating(false);
    }
  };

  const handleGenerateArrearBank = async () => {
    const params = buildParams();
    if (!params) return;
    setBankGenerating(true);
    try {
      const data = buildArrearBankStatementData({
        ...params,
        banks,
        departmentId: bankDepartmentId || undefined,
      });
      if (data.rows.length === 0) {
        toast.warning(
          'No arrear bank-statement data for the selected period and department.',
        );
        return;
      }
      await openPDFInNewTab(createElement(BankStatementPTAPDF, { data }));
      toast.success('Arrear bank statement PDF generated.');
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Failed to generate arrear bank statement PDF',
      );
    } finally {
      setBankGenerating(false);
    }
  };

  const handleGenerateArrearBankExcel = async () => {
    const params = buildParams();
    if (!params) return;
    setBankGenerating(true);
    try {
      const data = buildArrearBankStatementData({
        ...params,
        banks,
        departmentId: bankDepartmentId || undefined,
      });
      if (data.rows.length === 0) {
        toast.warning(
          'No arrear bank-statement data for the selected period and department.',
        );
        return;
      }
      await generateBankStatementPTAExcel(data);
      toast.success('Arrear bank statement Excel generated.');
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : 'Failed to generate arrear bank statement Excel',
      );
    } finally {
      setBankGenerating(false);
    }
  };

  return (
    <div className='space-y-6 w-full'>
      <div className='border-b border-border pb-2'>
        <h1 className='text-2xl font-bold text-primary text-center'>Arrear</h1>
      </div>

      <Card className='shadow-sm border-border max-w-4xl mx-auto'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-center text-lg font-semibold text-foreground'>
            Arrear Generator
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-5 pt-0'>
          <InfoStripe
            text='The Date Range must be between April 1st and March 31st of the Financial Year.'
            className='mb-6'
          />
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label>From Date</Label>
              <DatePicker
                value={fromDate}
                onChange={setFromDate}
                placeholder='mm/dd/yyyy'
              />
            </div>
            <div className='space-y-2'>
              <Label>To Date</Label>
              <DatePicker
                value={toDate}
                onChange={setToDate}
                placeholder='mm/dd/yyyy'
              />
            </div>
            <div className='space-y-2'>
              <Label>Work Order</Label>
              <Select
                value={workOrderId || 'default'}
                onValueChange={(v) => setWorkOrderId(v === 'default' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select Work Order No.' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='default'>Default</SelectItem>
                  {workOrders.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.workOrderNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Work Location</Label>
              <input
                type='text'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder='Name and location of work'
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />
            </div>
            <div className='space-y-2'>
              <Label>Principal Employer</Label>
              <input
                type='text'
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder='Name and address of principal employer'
                className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='radio'
              id='arrear-da'
              name='arrear-type'
              value='DA'
              checked={arrearType === 'DA'}
              onChange={() => setArrearType('DA')}
              className='h-4 w-4 border-border'
            />
            <Label htmlFor='arrear-da' className='font-normal cursor-pointer'>
              DA
            </Label>
          </div>

          <div className='flex flex-wrap gap-3'>
            <Button
              onClick={handleGeneratePDF}
              className='min-w-[160px] bg-primary text-primary-foreground hover:bg-primary/90'
            >
              Generate PDF
            </Button>
            <Button
              onClick={handleGenerateExcel}
              variant='outline'
              className='min-w-[160px]'
            >
              Generate Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 w-full'>
        <Card className='shadow-sm border-border'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-center text-lg font-semibold text-foreground'>
              Arrear PF
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5 pt-0'>
            <div className='space-y-2'>
              <Label>Department</Label>
              <Select
                value={pfDepartmentId || 'all'}
                onValueChange={(v) => setPfDepartmentId(v === 'all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Departments' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap justify-center gap-2'>
              <Button
                onClick={handleGenerateArrearPF}
                disabled={pfGenerating}
                className='min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {pfGenerating ? 'Generating…' : 'PF PDF'}
              </Button>
              <Button
                onClick={handleGenerateArrearPFExcel}
                disabled={pfGenerating}
                variant='outline'
                className='min-w-[140px]'
              >
                {pfGenerating ? 'Generating…' : 'PF Excel'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-border'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-center text-lg font-semibold text-foreground'>
              Arrear ESIC
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5 pt-0'>
            <div className='space-y-2'>
              <Label>ESI State</Label>
              <Select
                value={esicState || 'all'}
                onValueChange={(v) => setEsicState(v === 'all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All States' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All States</SelectItem>
                  {INDIAN_STATES_AND_UTS.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap justify-center gap-2'>
              <Button
                onClick={handleGenerateArrearESIC}
                disabled={esicGenerating}
                className='min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {esicGenerating ? 'Generating…' : 'ESIC PDF'}
              </Button>
              <Button
                onClick={handleGenerateArrearESICExcel}
                disabled={esicGenerating}
                variant='outline'
                className='min-w-[140px]'
              >
                {esicGenerating ? 'Generating…' : 'ESIC Excel'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className='shadow-sm border-border'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-center text-lg font-semibold text-foreground'>
              Arrear Bank Statement
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5 pt-0'>
            <div className='space-y-2'>
              <Label>Department</Label>
              <Select
                value={bankDepartmentId || 'all'}
                onValueChange={(v) => setBankDepartmentId(v === 'all' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All Departments' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex flex-wrap justify-center gap-2'>
              <Button
                onClick={handleGenerateArrearBank}
                disabled={bankGenerating}
                className='min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {bankGenerating ? 'Generating…' : 'Bank PDF'}
              </Button>
              <Button
                onClick={handleGenerateArrearBankExcel}
                disabled={bankGenerating}
                variant='outline'
                className='min-w-[140px]'
              >
                {bankGenerating ? 'Generating…' : 'Bank Excel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ArrearPage;
