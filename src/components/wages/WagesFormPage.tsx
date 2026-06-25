import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addWages, updateWages } from "@/store/slices/wagesSlice";
import { fetchEmployees } from "@/store/slices/employeeSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchWorkOrders } from "@/store/slices/workOrderSlice";
import { wagesSchema, type WagesFormValues } from "@/lib/validators";
import { MONTHS } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";

export function WagesFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const employees = useAppSelector((state) => state.employees.items);
  const designations = useAppSelector((state) => state.designations.items);
  const workOrders = useAppSelector((state) => state.workOrders.items);
  const wagesItems = useAppSelector((state) => state.wages.items);

  const existing = isEditing ? wagesItems.find((w) => w.id === id) : null;

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(wagesSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      totalWorkingDays: 26,
      attendance: 0,
      total: 0,
      netAmountPaid: 0,
      incentiveApplicable: false,
      isAdvanceDeduction: false,
      isDamageDeduction: false,
    },
  });

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDesignations());
    dispatch(fetchWorkOrders());
  }, [dispatch]);

  useEffect(() => {
    if (existing) {
      Object.entries(existing).forEach(([key, value]) => {
        if (key !== "id" && value !== undefined) {
          setValue(key as keyof WagesFormValues, value as never);
        }
      });
    }
  }, [existing, setValue]);

  // Auto-calculate totals
  const watched = useWatch({ control });

  useEffect(() => {
    const basic = Number(watched.basic) || 0;
    const da = Number(watched.da) || 0;
    setValue("payRate", basic + da);
  }, [watched.basic, watched.da, setValue]);

  useEffect(() => {
    const basic = Number(watched.basic) || 0;
    const da = Number(watched.da) || 0;
    const payRate = Number(watched.payRate) || 0;
    const allowances = Number(watched.allowances) || 0;
    const otherCash = Number(watched.otherCash) || 0;
    const incentiveAmount = Number(watched.incentiveAmount) || 0;

    const totalEarnings = basic + da + payRate + allowances + otherCash + incentiveAmount;
    setValue("total", totalEarnings);

    const otherDeduction = Number(watched.otherDeduction) || 0;
    const advanceDeduction = Number(watched.advanceDeduction) || 0;
    const damageDeduction = Number(watched.damageDeduction) || 0;
    const totalDeductions = otherDeduction + advanceDeduction + damageDeduction;

    setValue("netAmountPaid", totalEarnings - totalDeductions);
  }, [
    watched.basic, watched.da, watched.payRate, watched.allowances,
    watched.otherCash, watched.incentiveAmount, watched.otherDeduction,
    watched.advanceDeduction, watched.damageDeduction, setValue,
  ]);

  const onSubmit = async (data: WagesFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateWages({ id, data }));
      if (updateWages.fulfilled.match(result)) { toast.success("Wages updated"); navigate("/wages"); }
      else toast.error(result.payload as string);
    } else {
      const result = await dispatch(addWages(data));
      if (addWages.fulfilled.match(result)) { toast.success("Wages created"); navigate("/wages"); }
      else toast.error(result.payload as string);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Wages" : "Add Wages"}
        action={<Button variant="outline" onClick={() => navigate("/wages")}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Fields */}
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={watched.employee ?? ""} onValueChange={(v) => setValue("employee", v)}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name || e.code}</SelectItem>))}</SelectContent>
                </Select>
                {errors.employee && <p className="text-sm text-destructive">{String(errors.employee.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Designation *</Label>
                <Select value={watched.designation ?? ""} onValueChange={(v) => setValue("designation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>{designations.map((d) => (<SelectItem key={d.id} value={d.id}>{d.designation}</SelectItem>))}</SelectContent>
                </Select>
                {errors.designation && <p className="text-sm text-destructive">{String(errors.designation.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Work Order</Label>
                <Select value={watched.workOrderHr ?? ""} onValueChange={(v) => setValue("workOrderHr", v)}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {workOrders.map((w) => (<SelectItem key={w.id} value={w.id}>{w.workOrderNumber}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={String(watched.month ?? "")} onValueChange={(v) => setValue("month", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map((m) => (<SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={String(watched.year ?? "")} onValueChange={(v) => setValue("year", Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Total Working Days *</Label><Input type="number" {...register("totalWorkingDays")} />{errors.totalWorkingDays && <p className="text-sm text-destructive">{String(errors.totalWorkingDays.message)}</p>}</div>
              <div className="space-y-2"><Label>Attendance *</Label><Input type="number" {...register("attendance")} />{errors.attendance && <p className="text-sm text-destructive">{String(errors.attendance.message)}</p>}</div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardHeader><CardTitle className="text-base">Earnings</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label>Basic</Label><Input type="number" step="0.01" {...register("basic")} /></div>
              <div className="space-y-2"><Label>DA</Label><Input type="number" step="0.01" {...register("da")} /></div>
              <div className="space-y-2"><Label>Pay Rate</Label><Input type="number" step="0.01" {...register("payRate")} /></div>
              <div className="space-y-2"><Label>Allowances</Label><Input type="number" step="0.01" {...register("allowances")} /></div>
              <div className="space-y-2"><Label>Other Cash</Label><Input type="number" step="0.01" {...register("otherCash")} /></div>
              <div className="space-y-2"><Label>Other Cash Description</Label><Input {...register("otherCashDescription")} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Incentives */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incentives</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <Switch checked={!!watched.incentiveApplicable} onCheckedChange={(v) => setValue("incentiveApplicable", v)} />
                <Label>Incentive Applicable</Label>
              </div>
              <div className="space-y-2"><Label>Incentive Days</Label><Input type="number" {...register("incentiveDays")} /></div>
              <div className="space-y-2"><Label>Incentive Amount</Label><Input type="number" step="0.01" {...register("incentiveAmount")} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Deductions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2"><Label>Other Deduction</Label><Input type="number" step="0.01" {...register("otherDeduction")} /></div>
              <div className="space-y-2"><Label>Other Deduction Description</Label><Input {...register("otherDeductionDescription")} /></div>
              <div className="flex items-center gap-3 pt-6"><Switch checked={!!watched.isAdvanceDeduction} onCheckedChange={(v) => setValue("isAdvanceDeduction", v)} /><Label>Advance Deduction</Label></div>
              <div className="space-y-2"><Label>Advance Amount</Label><Input type="number" step="0.01" {...register("advanceDeduction")} /></div>
              <div className="flex items-center gap-3 pt-6"><Switch checked={!!watched.isDamageDeduction} onCheckedChange={(v) => setValue("isDamageDeduction", v)} /><Label>Damage Deduction</Label></div>
              <div className="space-y-2"><Label>Damage Amount</Label><Input type="number" step="0.01" {...register("damageDeduction")} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₹{(watched.total ?? 0).toLocaleString()}</p>
              </div>
              <Separator orientation="vertical" className="hidden sm:block h-10" />
              <div className="text-center sm:text-right">
                <p className="text-sm text-muted-foreground">Net Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{(watched.netAmountPaid ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/wages")}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            <Save className="h-4 w-4" />
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
