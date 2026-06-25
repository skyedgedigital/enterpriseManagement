import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MONTHS } from '@/lib/constants';
import type { WorkOrder } from '@/types';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);

export interface CLMYearMonthWorkOrderProps {
  year: number;
  month: number;
  workOrderId: string;
  workOrders: WorkOrder[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onWorkOrderChange: (id: string) => void;
  onShowList: () => void;
  onAllowancesSlip: () => void;
  onAllowancesSlipExcel: () => void;
  onGenerateWagesRegister: () => void;
  onGenerateWagesRegisterExcel: () => void;
}

export function CLMYearMonthWorkOrder({
  year,
  month,
  workOrderId,
  workOrders,
  onYearChange,
  onMonthChange,
  onWorkOrderChange,
  onShowList,
  onAllowancesSlip,
  onAllowancesSlipExcel,
  onGenerateWagesRegister,
  onGenerateWagesRegisterExcel,
}: CLMYearMonthWorkOrderProps) {
  return (
    <Card className='shadow-sm'>
      <CardContent className='pt-6'>
        <h2 className='text-center text-base font-semibold mb-4'>
          Select Year and Month
        </h2>

        <div className='flex flex-wrap items-end gap-4'>
          <div className='space-y-2 min-w-[100px]'>
            <Label>Year</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => onYearChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2 min-w-[120px]'>
            <Label>Month</Label>
            <Select
              value={String(month)}
              onValueChange={(v) => onMonthChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2 min-w-[160px]'>
            <Label>Work Order</Label>
            <Select
              value={workOrderId || 'default'}
              onValueChange={(v) => onWorkOrderChange(v === 'default' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Default' />
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
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={onShowList}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              Show List
            </Button>
            <Button
              onClick={onAllowancesSlip}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              Allowances Slip
            </Button>
            <Button
              onClick={onAllowancesSlipExcel}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              Allowances Slip Excel
            </Button>
            <Button
              onClick={onGenerateWagesRegister}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              Generate Wages Register
            </Button>
            <Button
              onClick={onGenerateWagesRegisterExcel}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              Wages Register Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
