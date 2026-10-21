import { useFormContext } from 'react-hook-form';
import type { EmployeeFormValues } from '@/lib/validators';
import { useAppSelector } from '@/hooks/useAppSelector';
import { getBankDisplayName } from '@/lib/sanitize';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Bank } from '@/types';
import { useMemo, useState } from 'react';

export function BankStatutoryTab() {
  const { register, setValue, watch } = useFormContext<EmployeeFormValues>();
  const banks = useAppSelector((state) => state.banks.items);
  const esiLocations = useAppSelector((state) => state.esiLocations.items);

  const selectedBankId = watch('bank') ?? '';

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Banking Information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Bank</Label>
          <BankCombobox
            banks={banks}
            value={selectedBankId}
            onChange={(val) => setValue('bank', val, { shouldValidate: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input id="accountNumber" {...register('accountNumber')} />
        </div>
      </div>

      <Separator />

      <h3 className="text-lg font-semibold">Statutory Information</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={watch('pfApplicable') ?? false}
            onCheckedChange={(v) => setValue('pfApplicable', v)}
          />
          <Label>PF Applicable</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pfNo">PF Number</Label>
          <Input id="pfNo" {...register('pfNo')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="uan">UAN</Label>
          <Input id="uan" {...register('uan')} maxLength={12} />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={watch('esicApplicable') ?? false}
            onCheckedChange={(v) => setValue('esicApplicable', v)}
          />
          <Label>ESIC Applicable</Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor="esicNo">ESIC Number</Label>
          <Input id="esicNo" {...register('esicNo')} />
        </div>
        <div className="space-y-2">
          <Label>ESI Location</Label>
          <Select
            value={watch('esiLocation') ?? ''}
            onValueChange={(v) => setValue('esiLocation', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ESI location" />
            </SelectTrigger>
            <SelectContent>
              {esiLocations.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Helper component to enable bank search by name, branch or ifsc code

interface BankComboboxProps {
  banks: Bank[];
  value: string;
  onChange: (value: string) => void;
}

export function BankCombobox({ banks, value, onChange }: BankComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedBank = useMemo(
    () => banks.find((b) => b.id === value),
    [banks, value],
  );

  const filterBank = (itemValue: string, search: string) => {
    const cleanSearch = search.trim().toLowerCase();
    if (!cleanSearch) return 1;

    // Multiple words search support (e.g., "axis chandil" or "baroda ifsc")
    const searchWords = cleanSearch.split(/\s+/);
    const target = itemValue.toLowerCase();

    const isMatch = searchWords.every((word) => target.includes(word));
    return isMatch ? 1 : 0;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left h-9 px-3"
        >
          <span className="truncate">
            {selectedBank
              ? `${getBankDisplayName(selectedBank.name)} - ${selectedBank.branch} - ${selectedBank.ifsc}`
              : 'Select bank...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[var(--radix-popover-trigger-width)] max-w-[90vw] p-0 shadow-lg"
        align="start"
      >
        <Command
          // Strict substring search filter
          filter={filterBank}
        >
          <CommandInput placeholder="Search bank name, branch or IFSC..." />
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>No bank found.</CommandEmpty>
            <CommandGroup>
              {banks.map((bank) => {
                const displayName = getBankDisplayName(bank.name);
                const label = `${displayName} - ${bank.branch} - ${bank.ifsc}`;
                return (
                  <CommandItem
                    key={bank.id}
                    value={`${displayName} ${bank.branch} ${bank.ifsc}`}
                    onSelect={() => {
                      onChange(bank.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        value === bank.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span>{label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
