import { useFormContext } from "react-hook-form";
import type { EmployeeFormValues } from "@/lib/validators";
import { SEX_OPTIONS, MARITAL_STATUS_OPTIONS } from "@/lib/constants";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PersonalInfoTabProps {
  isNewEmployee?: boolean;
}

export function PersonalInfoTab({ isNewEmployee }: PersonalInfoTabProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<EmployeeFormValues>();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="code">Employee Code *</Label>
          <Input id="code" {...register("code")} readOnly={isNewEmployee} className={isNewEmployee ? "bg-muted" : undefined} />
          {isNewEmployee && <p className="text-xs text-muted-foreground">System-generated (EMP + 4 digits)</p>}
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workManNo">Workman No</Label>
          <Input id="workManNo" {...register("workManNo")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" {...register("name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fathersName">Father's Name</Label>
          <Input id="fathersName" {...register("fathersName")} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={watch("sex") ?? ""} onValueChange={(v) => setValue("sex", v as EmployeeFormValues["sex"])}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              {SEX_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <DatePicker
            value={watch("dob") ?? ""}
            onChange={(v) => setValue("dob", v)}
            placeholder="Select date of birth"
            fromYear={1950}
            toYear={currentYear}
          />
        </div>
        <div className="space-y-2">
          <Label>Marital Status</Label>
          <Select value={watch("maritalStatus") ?? ""} onValueChange={(v) => setValue("maritalStatus", v as EmployeeFormValues["maritalStatus"])}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {MARITAL_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input id="mobileNumber" {...register("mobileNumber")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="landlineNumber">Landline Number</Label>
          <Input id="landlineNumber" {...register("landlineNumber")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adhaarNumber">Aadhaar Number</Label>
          <Input id="adhaarNumber" {...register("adhaarNumber")} maxLength={12} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...register("address")} rows={3} />
      </div>
    </div>
  );
}
