import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addSite, updateSite, fetchSiteById, clearSelectedSite } from "@/store/slices/siteSlice";
import { siteSchema, type SiteFormValues } from "@/lib/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function SiteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedItem, loading } = useAppSelector((state) => state.sites);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
  });

  useEffect(() => {
    if (isEditing && id) {
      dispatch(fetchSiteById(id));
    }
    return () => { dispatch(clearSelectedSite()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && selectedItem) {
      reset({ name: selectedItem.name });
    }
  }, [isEditing, selectedItem, reset]);

  const onSubmit = async (data: SiteFormValues) => {
    if (isEditing && id) {
      const result = await dispatch(updateSite({ id, data }));
      if (updateSite.fulfilled.match(result)) {
        toast.success("Site updated successfully");
        navigate("/sites");
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addSite(data));
      if (addSite.fulfilled.match(result)) {
        toast.success("Site created successfully");
        navigate("/sites");
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
        title={isEditing ? "Edit Site" : "Add Site"}
        description={isEditing ? `Editing: ${selectedItem?.name}` : "Create a new site"}
        action={
          <Button variant="outline" onClick={() => navigate("/sites")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Site Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name *</Label>
                <Input id="name" {...register("name")} placeholder="Enter site name" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/sites")}>Cancel</Button>
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
