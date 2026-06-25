import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { fetchEmployeeById, clearSelectedEmployee } from "@/store/slices/employeeSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchBanks } from "@/store/slices/bankSlice";
import { fetchSites } from "@/store/slices/siteSlice";
import { fetchEsiLocations } from "@/store/slices/esiLocationSlice";
import { getBankDisplayName } from "@/lib/sanitize";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedEmployee: emp, loading } = useAppSelector((state) => state.employees);
  const departments = useAppSelector((state) => state.departments.items);
  const designations = useAppSelector((state) => state.designations.items);
  const banks = useAppSelector((state) => state.banks.items);
  const sites = useAppSelector((state) => state.sites.items);
  const esiLocations = useAppSelector((state) => state.esiLocations.items);

  useEffect(() => {
    if (id) {
      dispatch(fetchEmployeeById(id));
      dispatch(fetchDepartments());
      dispatch(fetchDesignations());
      dispatch(fetchBanks());
      dispatch(fetchSites());
      dispatch(fetchEsiLocations());
    }
    return () => { dispatch(clearSelectedEmployee()); };
  }, [dispatch, id]);

  if (loading || !emp) return <LoadingState type="form" />;

  const getDeptName = (dId?: string) => departments.find((d) => d.id === dId)?.name ?? "-";
  const getDesigName = (dId?: string) => designations.find((d) => d.id === dId)?.designation ?? "-";
  const getBankName = (bId?: string) => { const b = banks.find((x) => x.id === bId); return b ? `${getBankDisplayName(b.name)} - ${b.branch}` : "-"; };
  const getSiteName = (sId?: string) => sites.find((s) => s.id === sId)?.name ?? "-";
  const getEsiName = (eId?: string) => esiLocations.find((e) => e.id === eId)?.name ?? "-";

  const Field = ({ label, value }: { label: string; value?: string | number | boolean | null }) => (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 font-medium">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : (value || "-")}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Details"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/employees")}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => navigate(`/employees/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </div>
        }
      />

      {/* Header Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="h-20 w-20">
              <AvatarImage src={emp.profilePhotoUrl} />
              <AvatarFallback className="text-2xl">{emp.name?.charAt(0) ?? emp.code.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold">{emp.name || emp.code}</h2>
              <p className="text-muted-foreground">Code: {emp.code} {emp.workManNo && `| Workman: ${emp.workManNo}`}</p>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge variant={emp.workingStatus ? "default" : "secondary"}>{emp.workingStatus ? "Active" : "Inactive"}</Badge>
                {emp.department && <Badge variant="outline">{getDeptName(emp.department)}</Badge>}
                {emp.designation && <Badge variant="outline">{getDesigName(emp.designation)}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal */}
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Father's Name" value={emp.fathersName} />
            <Field label="Gender" value={emp.sex} />
            <Field label="Date of Birth" value={emp.dob} />
            <Field label="Marital Status" value={emp.maritalStatus} />
            <Field label="Mobile" value={emp.mobileNumber} />
            <Field label="Landline" value={emp.landlineNumber} />
            <Field label="Aadhaar" value={emp.adhaarNumber} />
            <div className="col-span-2"><Field label="Address" value={emp.address} /></div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader><CardTitle className="text-base">Employment</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Department" value={getDeptName(emp.department)} />
            <Field label="Designation" value={getDesigName(emp.designation)} />
            <Field label="Site" value={getSiteName(emp.site)} />
            <Field label="Appointment Date" value={emp.appointmentDate} />
            <Field label="Resign Date" value={emp.resignDate} />
            <Field label="Safety Pass" value={emp.safetyPassNumber} />
            <Field label="SP Validity" value={emp.spValidity} />
            <Field label="Gate Pass" value={emp.gatePassNumber} />
          </CardContent>
        </Card>

        {/* Bank & Statutory */}
        <Card>
          <CardHeader><CardTitle className="text-base">Bank & Statutory</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Bank" value={getBankName(emp.bank)} />
            <Field label="Account No" value={emp.accountNumber} />
            <Field label="PF Applicable" value={emp.pfApplicable} />
            <Field label="PF No" value={emp.pfNo} />
            <Field label="UAN" value={emp.uan} />
            <Field label="ESIC Applicable" value={emp.esicApplicable} />
            <Field label="ESIC No" value={emp.esicNo} />
            <Field label="ESI Location" value={getEsiName(emp.esiLocation)} />
          </CardContent>
        </Card>

        {/* Salary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Salary Components</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Basic" value={emp.basic} />
            <Field label="DA" value={emp.da} />
            <Field label="Pay Rate (Basic + DA)" value={emp.payRate} />
            <Field label="HRA" value={emp.hra} />
            <Field label="CA" value={emp.ca} />
            <Field label="Food" value={emp.food} />
            <Field label="Incentives" value={emp.incentives} />
            <Field label="Uniform" value={emp.uniform} />
            <Field label="Medical" value={emp.medical} />
            <Field label="Loan" value={emp.loan} />
            <Field label="LIC" value={emp.lic} />
            <Field label="Old Basic" value={emp.oldBasic} />
            <Field label="Old DA" value={emp.oldDa} />
            <Field label="Attendance Allowance" value={emp.attendanceAllowance} />
          </CardContent>
        </Card>
      </div>

      {/* Embedded Arrays */}
      {(emp.bonus?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Bonus Records</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {emp.bonus?.map((b, i) => (
                <Badge key={i} variant={b.status ? "default" : "secondary"}>{b.year}: {b.status ? "Paid" : "Pending"}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(emp.leave?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Leave Records</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {emp.leave?.map((l, i) => (
                <Badge key={i} variant={l.status ? "default" : "secondary"}>{l.year}: {l.status ? "Encashed" : "Pending"}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
