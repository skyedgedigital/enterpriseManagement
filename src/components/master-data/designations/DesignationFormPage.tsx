import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addDesignation, updateDesignation, fetchDesignationById, clearSelectedDesignation } from "@/store/slices/designationSlice";
import { designationSchema, type DesignationFormValues } from "@/lib/validators";
import { formatMoney2 } from "@/lib/moneyRounding";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function DesignationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector((state) => state.designations);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
  });

  const basic = watch("basic");
  const da = watch("da");
  useEffect(() => {
    const b = Number(basic) || 0;
    const d = Number(da) || 0;
    setValue("payRate", formatMoney2(b + d));
  }, [basic, da, setValue]);

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchDesignationById(id));
    }
    return () => { dispatch(clearSelectedDesignation()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      reset({
        designation: selectedItem.designation,
        basic: selectedItem.basic,
        oldBasic: selectedItem.oldBasic,
        da: selectedItem.da,
        oldDa: selectedItem.oldDa,
        payRate: selectedItem.payRate,
        basic2: selectedItem.basic2,
      });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (raw: DesignationFormValues) => {
    const numericKeys = ["basic", "oldBasic", "da", "oldDa", "payRate", "basic2"] as const;
    const data = { ...raw };
    for (const k of numericKeys) {
      if (data[k]) data[k] = formatMoney2(Number(data[k]));
    }

    if (isEditing && id) {
      const result = await dispatch(updateDesignation({ id, data }));
      if (updateDesignation.fulfilled.match(result)) {
        toast.success("Designation updated successfully");
        navigate("/designations");
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addDesignation(data));
      if (addDesignation.fulfilled.match(result)) {
        toast.success("Designation created successfully");
        navigate("/designations");
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  if (isEditing && loading && !selectedItem) {
    return <LoadingState type="form" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Designation" : "Add Designation"}
        description={isEditing ? `Editing: ${selectedItem?.designation}` : "Create a new designation"}
        action={
          <Button variant="outline" onClick={() => navigate("/designations")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Designation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation Name *</Label>
              <Input id="designation" {...register("designation")} placeholder="Enter designation name" />
              {errors.designation && <p className="text-sm text-destructive">{errors.designation.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="basic">Basic *</Label>
                <Input id="basic" {...register("basic")} placeholder="Enter basic amount" />
                {errors.basic && <p className="text-sm text-destructive">{errors.basic.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldBasic">Old Basic</Label>
                <Input id="oldBasic" {...register("oldBasic")} placeholder="Enter old basic amount" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="da">DA *</Label>
                <Input id="da" {...register("da")} placeholder="Enter DA amount" />
                {errors.da && <p className="text-sm text-destructive">{errors.da.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldDa">Old DA</Label>
                <Input id="oldDa" {...register("oldDa")} placeholder="Enter old DA amount" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payRate">Pay Rate *</Label>
                <Input id="payRate" {...register("payRate")} placeholder="Enter pay rate" />
                {errors.payRate && <p className="text-sm text-destructive">{errors.payRate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic2">Basic 2</Label>
                <Input id="basic2" {...register("basic2")} placeholder="Enter basic 2 amount" />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/designations")}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                <Save className="h-4 w-4" />
                {isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
