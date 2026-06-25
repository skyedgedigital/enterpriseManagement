import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addEsiLocation, updateEsiLocation, fetchEsiLocationById, clearSelectedEsiLocation } from "@/store/slices/esiLocationSlice";
import { esiLocationSchema, type EsiLocationFormValues } from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function EsiLocationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector((state) => state.esiLocations);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EsiLocationFormValues>({
    resolver: zodResolver(esiLocationSchema),
  });

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchEsiLocationById(id));
    }
    return () => { dispatch(clearSelectedEsiLocation()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      reset({
        name: selectedItem.name,
        address: selectedItem.address,
        esiNo: selectedItem.esiNo,
        branch: selectedItem.branch,
      });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: EsiLocationFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateEsiLocation({ id, data }));
      if (updateEsiLocation.fulfilled.match(result)) {
        toast.success("ESI Location updated successfully");
        navigate("/esi-locations");
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addEsiLocation(data));
      if (addEsiLocation.fulfilled.match(result)) {
        toast.success("ESI Location created successfully");
        navigate("/esi-locations");
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
        title={isEditing ? "Edit ESI Location" : "Add ESI Location"}
        description={isEditing ? `Editing: ${selectedItem?.name}` : "Create a new ESI location"}
        action={
          <Button variant="outline" onClick={() => navigate("/esi-locations")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ESI Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input id="name" {...register("name")} placeholder="Enter location name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="esiNo">ESI Number *</Label>
                <Input id="esiNo" {...register("esiNo")} placeholder="Enter ESI number" />
                {errors.esiNo && <p className="text-sm text-destructive">{errors.esiNo.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Input id="branch" {...register("branch")} placeholder="Enter branch name" />
                {errors.branch && <p className="text-sm text-destructive">{errors.branch.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input id="address" {...register("address")} placeholder="Enter address" />
                {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/esi-locations")}>Cancel</Button>
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
