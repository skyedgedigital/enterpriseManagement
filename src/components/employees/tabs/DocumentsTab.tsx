import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/shared/FileUpload";

interface DocumentsTabProps {
  docUrls: {
    profilePhotoUrl: string;
    drivingLicenseUrl: string;
    aadharCardUrl: string;
    bankPassbookUrl: string;
  };
  onDocUrlChange: (key: string, url: string) => void;
  employeeCode: string;
}

export function DocumentsTab({ docUrls, onDocUrlChange, employeeCode }: DocumentsTabProps) {
  const basePath = `employees/${employeeCode || "new"}`;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Documents</h3>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <FileUpload
            value={docUrls.profilePhotoUrl}
            onChange={(url) => onDocUrlChange("profilePhotoUrl", url)}
            storagePath={`${basePath}/profile`}
            label="Upload Profile Photo"
            accept="image/*"
          />
        </div>
        <div className="space-y-2">
          <Label>Driving License</Label>
          <FileUpload
            value={docUrls.drivingLicenseUrl}
            onChange={(url) => onDocUrlChange("drivingLicenseUrl", url)}
            storagePath={`${basePath}/driving-license`}
            label="Upload Driving License"
          />
        </div>
        <div className="space-y-2">
          <Label>Aadhaar Card</Label>
          <FileUpload
            value={docUrls.aadharCardUrl}
            onChange={(url) => onDocUrlChange("aadharCardUrl", url)}
            storagePath={`${basePath}/aadhaar`}
            label="Upload Aadhaar Card"
          />
        </div>
        <div className="space-y-2">
          <Label>Bank Passbook</Label>
          <FileUpload
            value={docUrls.bankPassbookUrl}
            onChange={(url) => onDocUrlChange("bankPassbookUrl", url)}
            storagePath={`${basePath}/passbook`}
            label="Upload Bank Passbook"
          />
        </div>
      </div>
    </div>
  );
}
