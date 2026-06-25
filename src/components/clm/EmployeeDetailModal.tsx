import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { employeeService } from "@/services/employee.service";
import { useAppSelector } from "@/hooks/useAppSelector";
import { getBankDisplayName } from "@/lib/sanitize";
import type { Employee } from "@/types";

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 font-medium">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : (value ?? "-")}
      </p>
    </div>
  );
}

export interface EmployeeDetailModalProps {
  employeeCode: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailModal({
  employeeCode,
  open,
  onOpenChange,
}: EmployeeDetailModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departments = useAppSelector((s) => s.departments.items);
  const designations = useAppSelector((s) => s.designations.items);
  const banks = useAppSelector((s) => s.banks.items);
  const sites = useAppSelector((s) => s.sites.items);
  const esiLocations = useAppSelector((s) => s.esiLocations.items);

  useEffect(() => {
    if (!open || !employeeCode) {
      setEmployee(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    employeeService
      .getByCode(employeeCode)
      .then((emp) => {
        setEmployee(emp ?? null);
        if (!emp) setError("Employee not found");
      })
      .catch(() => setError("Failed to load employee"))
      .finally(() => setLoading(false));
  }, [open, employeeCode]);

  const getDeptName = (id?: string) => departments.find((d) => d.id === id)?.name ?? "-";
  const getDesigName = (id?: string) => designations.find((d) => d.id === id)?.designation ?? "-";
  const getBankName = (id?: string) => {
    const b = banks.find((x) => x.id === id);
    return b ? `${getBankDisplayName(b.name)} - ${b.branch}` : "-";
  };
  const getSiteName = (id?: string) => sites.find((s) => s.id === id)?.name ?? "-";
  const getEsiName = (id?: string) => esiLocations.find((e) => e.id === id)?.name ?? "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {!loading && employee && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <Field label="Code" value={employee.code} />
              <Field label="Name" value={employee.name} />
              <Field label="Workman No" value={employee.workManNo} />
              <Field label="Father's Name" value={employee.fathersName} />
              <Field label="Gender" value={employee.sex} />
              <Field label="DOB" value={employee.dob} />
              <Field label="Mobile" value={employee.mobileNumber} />
              <Field label="Aadhaar" value={employee.adhaarNumber} />
              <div className="col-span-2">
                <Field label="Address" value={employee.address} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <Field label="Department" value={getDeptName(employee.department)} />
              <Field label="Designation" value={getDesigName(employee.designation)} />
              <Field label="Site" value={getSiteName(employee.site)} />
              <Field label="Appointment Date" value={employee.appointmentDate} />
              <Field label="Bank" value={getBankName(employee.bank)} />
              <Field label="Account No" value={employee.accountNumber} />
              <Field label="UAN" value={employee.uan} />
              <Field label="ESIC No" value={employee.esicNo} />
              <Field label="ESI Location" value={getEsiName(employee.esiLocation)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Basic" value={employee.basic} />
              <Field label="DA" value={employee.da} />
              <Field label="Pay Rate" value={employee.payRate} />
              <Field label="HRA" value={employee.hra} />
              <Field label="CA" value={employee.ca} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
