import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { addEmployee, updateEmployee, fetchEmployeeById, clearSelectedEmployee } from "@/store/slices/employeeSlice";
import { fetchDepartments } from "@/store/slices/departmentSlice";
import { fetchDesignations } from "@/store/slices/designationSlice";
import { fetchBanks } from "@/store/slices/bankSlice";
import { fetchSites } from "@/store/slices/siteSlice";
import { fetchEsiLocations } from "@/store/slices/esiLocationSlice";
import { employeeSchema, type EmployeeFormValues } from "@/lib/validators";
import { getNextEmployeeCode, isEmployeeCodeUnique } from "@/services/employeeCode.service";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";

import { PersonalInfoTab } from "./tabs/PersonalInfoTab";
import { EmploymentTab } from "./tabs/EmploymentTab";
import { BankStatutoryTab } from "./tabs/BankStatutoryTab";
import { SalaryTab } from "./tabs/SalaryTab";
import { DocumentsTab } from "./tabs/DocumentsTab";

export function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isEditing = !!id;

  const { selectedEmployee, loading } = useAppSelector((state) => state.employees);

  const [docUrls, setDocUrls] = useState({
    profilePhotoUrl: "",
    drivingLicenseUrl: "",
    aadharCardUrl: "",
    bankPassbookUrl: "",
  });

  const methods = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { code: "", workingStatus: true },
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchDesignations());
    dispatch(fetchBanks());
    dispatch(fetchSites());
    dispatch(fetchEsiLocations());

    if (isEditing && id) {
      dispatch(fetchEmployeeById(id));
    }
    return () => { dispatch(clearSelectedEmployee()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      getNextEmployeeCode().then((code) => methods.setValue("code", code));
    }
  }, [isEditing, methods]);

  useEffect(() => {
    if (isEditing && selectedEmployee) {
      methods.reset({
        code: selectedEmployee.code,
        workManNo: selectedEmployee.workManNo ?? "",
        name: selectedEmployee.name ?? "",
        fathersName: selectedEmployee.fathersName ?? "",
        sex: selectedEmployee.sex,
        dob: selectedEmployee.dob ?? "",
        maritalStatus: selectedEmployee.maritalStatus,
        address: selectedEmployee.address ?? "",
        landlineNumber: selectedEmployee.landlineNumber ?? "",
        mobileNumber: selectedEmployee.mobileNumber ?? "",
        adhaarNumber: selectedEmployee.adhaarNumber ?? "",
        department: selectedEmployee.department ?? "",
        site: selectedEmployee.site ?? "",
        designation: selectedEmployee.designation ?? "",
        workingStatus: selectedEmployee.workingStatus ?? true,
        appointmentDate: selectedEmployee.appointmentDate ?? "",
        resignDate: selectedEmployee.resignDate ?? "",
        bank: selectedEmployee.bank ?? "",
        accountNumber: selectedEmployee.accountNumber ?? "",
        pfApplicable: selectedEmployee.pfApplicable ?? false,
        pfNo: selectedEmployee.pfNo ?? "",
        uan: selectedEmployee.uan ?? "",
        esicApplicable: selectedEmployee.esicApplicable ?? false,
        esicNo: selectedEmployee.esicNo ?? "",
        esiLocation: selectedEmployee.esiLocation ?? "",
        basic: selectedEmployee.basic ?? "",
        da: selectedEmployee.da ?? "",
        payRate: selectedEmployee.payRate ?? "",
        hra: selectedEmployee.hra ?? "",
        ca: selectedEmployee.ca ?? "",
        food: selectedEmployee.food ?? "",
        incentives: selectedEmployee.incentives ?? "",
        uniform: selectedEmployee.uniform ?? "",
        medical: selectedEmployee.medical ?? "",
        loan: selectedEmployee.loan ?? "",
        lic: selectedEmployee.lic ?? "",
        oldBasic: selectedEmployee.oldBasic ?? "",
        oldDa: selectedEmployee.oldDa ?? "",
        attendanceAllowance: selectedEmployee.attendanceAllowance ?? false,
        safetyPassNumber: selectedEmployee.safetyPassNumber ?? "",
        spValidity: selectedEmployee.spValidity ?? "",
        policeVerificationValidityDate: selectedEmployee.policeVerificationValidityDate ?? "",
        gatePassNumber: selectedEmployee.gatePassNumber ?? "",
        gatePassValidTill: selectedEmployee.gatePassValidTill ?? "",
      });
      setDocUrls({
        profilePhotoUrl: selectedEmployee.profilePhotoUrl ?? "",
        drivingLicenseUrl: selectedEmployee.drivingLicenseUrl ?? "",
        aadharCardUrl: selectedEmployee.aadharCardUrl ?? "",
        bankPassbookUrl: selectedEmployee.bankPassbookUrl ?? "",
      });
    }
  }, [isEditing, selectedEmployee, methods]);

  const onSubmit = async (data: EmployeeFormValues) => {
    const unique = await isEmployeeCodeUnique(data.code, isEditing ? id : undefined);
    if (!unique) {
      toast.error("Employee code is already in use. Please use a unique code.");
      return;
    }
    const payload = {
      ...data,
      ...docUrls,
    };

    if (isEditing && id) {
      const result = await dispatch(updateEmployee({ id, data: payload }));
      if (updateEmployee.fulfilled.match(result)) {
        toast.success("Employee updated successfully");
        navigate(`/employees/${id}`);
      } else {
        toast.error(result.payload as string);
      }
    } else {
      const result = await dispatch(addEmployee(payload));
      if (addEmployee.fulfilled.match(result)) {
        toast.success("Employee created successfully");
        navigate("/employees");
      } else {
        toast.error(result.payload as string);
      }
    }
  };

  if (isEditing && loading && !selectedEmployee) {
    return <LoadingState type="form" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "Edit Employee" : "Add Employee"}
        description={isEditing ? `Editing employee: ${selectedEmployee?.name ?? selectedEmployee?.code}` : "Fill in the employee details"}
        action={
          <Button variant="outline" onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="personal" className="space-y-6">
                <TabsList className="flex flex-wrap h-auto gap-1">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="bank-statutory">Bank & Statutory</TabsTrigger>
                  <TabsTrigger value="salary">Salary</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal"><PersonalInfoTab
                    isNewEmployee={!isEditing} /></TabsContent>
                <TabsContent value="employment"><EmploymentTab /></TabsContent>
                <TabsContent value="bank-statutory"><BankStatutoryTab /></TabsContent>
                <TabsContent value="salary"><SalaryTab /></TabsContent>
                <TabsContent value="documents">
                  <DocumentsTab
                    docUrls={docUrls}
                    onDocUrlChange={(key, url) => setDocUrls((prev) => ({ ...prev, [key]: url }))}
                    employeeCode={methods.watch("code")}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/employees")}>
              Cancel
            </Button>
            <Button type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting && <Loader2 className="animate-spin" />}
              <Save className="h-4 w-4" />
              {isEditing ? "Update Employee" : "Create Employee"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
