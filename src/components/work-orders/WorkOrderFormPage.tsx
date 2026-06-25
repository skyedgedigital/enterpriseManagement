import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addWorkOrder, updateWorkOrder, fetchWorkOrderById, clearSelectedWorkOrder } from "@/store/slices/workOrderSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { workOrderSchema, type WorkOrderFormValues } from "@/lib/validators";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants";
import { toSanitizedKey } from "@/lib/sanitize";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function WorkOrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;
  const { selectedItem, loading } = useAppSelector((state) => state.workOrders);
  const departments = useAppSelector((state) => state.departments.items);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    if (isEditing && id) dispatch(fetchWorkOrderById(id));
    return () => { dispatch(clearSelectedWorkOrder()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      const stateRaw = selectedItem.state ?? "";
      reset({
        workOrderNumber: selectedItem.workOrderNumber,
        date: selectedItem.date ?? "",
        jobDesc: selectedItem.jobDesc ?? "",
        orderDesc: selectedItem.orderDesc ?? "",
        dept: selectedItem.dept ?? "",
        section: selectedItem.section ?? "",
        validFrom: selectedItem.validFrom ?? "",
        validTo: selectedItem.validTo ?? "",
        lapseTill: selectedItem.lapseTill ?? "",
        state: stateRaw ? toSanitizedKey(stateRaw) || stateRaw : "",
        newPfApplicable: selectedItem.newPfApplicable ?? false,
      });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: WorkOrderFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateWorkOrder({ id, data }));
      if (updateWorkOrder.fulfilled.match(result)) { toast.success("Work order updated"); navigate("/work-orders"); }
      else toast.error(result.payload as string);
    } else {
      const result = await dispatch(addWorkOrder(data));
      if (addWorkOrder.fulfilled.match(result)) { toast.success("Work order created"); navigate("/work-orders"); }
      else toast.error(result.payload as string);
    }
  };

  if (isEditing && loading && !selectedItem) return <LoadingState type="form" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Work Order" : "Add Work Order"}
        action={<Button variant="outline" onClick={() => navigate("/work-orders")}><ArrowLeft className="h-4 w-4" /> Back</Button>}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Work Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Work Order Number *</Label>
                <Input {...register("workOrderNumber")} />
                {errors.workOrderNumber && <p className="text-sm text-destructive">{String(errors.workOrderNumber.message)}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker value={watch("date") ?? ""} onChange={(v) => setValue("date", v)} placeholder="Select date" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={watch("dept") ?? ""} onValueChange={(v) => setValue("dept", v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Section</Label><Input {...register("section")} /></div>
              <div className="space-y-2">
                <Label>Valid From</Label>
                <DatePicker value={watch("validFrom") ?? ""} onChange={(v) => setValue("validFrom", v)} placeholder="Select start date" />
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <DatePicker value={watch("validTo") ?? ""} onChange={(v) => setValue("validTo", v)} placeholder="Select end date" />
              </div>
              <div className="space-y-2">
                <Label>Lapse Till</Label>
                <DatePicker value={watch("lapseTill") ?? ""} onChange={(v) => setValue("lapseTill", v)} placeholder="Select lapse date" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={watch("state") ?? ""} onValueChange={(v) => setValue("state", v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES_AND_UTS.map((s) => (<SelectItem key={s} value={toSanitizedKey(s)}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                checked={watch("newPfApplicable") ?? false}
                onCheckedChange={(v) => setValue("newPfApplicable", v)}
              />
              <Label>New PF Applicable (15k cap)</Label>
            </div>
            <div className="space-y-2"><Label>Job Description</Label><Textarea {...register("jobDesc")} /></div>
            <div className="space-y-2"><Label>Order Description</Label><Textarea {...register("orderDesc")} /></div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/work-orders")}>Cancel</Button>
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
