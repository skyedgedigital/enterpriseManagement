import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addBank, updateBank, fetchBankById, clearSelectedBank } from "@/store/slices/bankSlice";
import { bankSchema, type BankFormValues } from "@/lib/validators";

import { BANK_NAMES } from "@/lib/constants";
import { toSanitizedKey, getBankDisplayName } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function BankFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector((state) => state.banks);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
  });

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchBankById(id));
    }
    return () => { dispatch(clearSelectedBank()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      const nameRaw = selectedItem.name ?? "";
      reset({
        name: nameRaw ? toSanitizedKey(nameRaw) || nameRaw : "",
        branch: selectedItem.branch,
        ifsc: selectedItem.ifsc,
      });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: BankFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateBank({ id, data }));
      if (updateBank.fulfilled.match(result)) {
        toast.success("Bank updated successfully");
        navigate("/banks");
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addBank(data));
      if (addBank.fulfilled.match(result)) {
        toast.success("Bank created successfully");
        navigate("/banks");
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
        title={isEditing ? "Edit Bank" : "Add Bank"}
        description={isEditing ? `Editing: ${getBankDisplayName(selectedItem?.name ?? "")}` : "Create a new bank"}
        action={
          <Button variant="outline" onClick={() => navigate("/banks")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Bank Name *</Label>
                <Select value={watch("name") ?? ""} onValueChange={(v) => setValue("name", v)}>
                  <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
                  <SelectContent>
                    {BANK_NAMES.map((name) => (
                      <SelectItem key={name} value={toSanitizedKey(name)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input id="branch" {...register("branch")} placeholder="Enter branch name" />
                {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code *</Label>
                <Input id="ifsc" {...register("ifsc")} placeholder="Enter IFSC code" maxLength={11} />
                {errors.ifsc && <p className="text-sm text-destructive">{errors.ifsc.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/banks")}>Cancel</Button>
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
