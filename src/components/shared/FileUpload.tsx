import { useState, useRef } from "react";
import { Upload, X, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { storageService } from "@/services/storage.service";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  storagePath: string;
  label?: string;
  accept?: string;
}

export function FileUpload({
  value,
  onChange,
  storagePath,
  label = "Upload File",
  accept = "image/*,.pdf",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const url = await storageService.upload(
        file,
        `${storagePath}/${Date.now()}_${file.name}`
      );
      onChange(url);
      toast.success("File uploaded successfully");
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {value.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
            <img
              src={value}
              alt="Preview"
              className="h-14 w-14 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted">
              <FileIcon className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 truncate text-sm text-muted-foreground">
            File uploaded
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : label}
        </Button>
      )}
    </div>
  );
}
