import { useEffect, useRef, useState } from 'react';
import { Camera, Image, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  CHALAN_IMAGE_TYPES,
  MAX_CHALAN_FILE_BYTES,
} from '@/lib/fleet-manager/constants';

const ACCEPT = 'image/jpeg,image/jpg,image/png';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ChalanPhotoFieldProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export function ChalanPhotoField({
  value,
  onChange,
  error,
  disabled = false,
}: ChalanPhotoFieldProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const clearInputs = () => {
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;

    if (
      !CHALAN_IMAGE_TYPES.includes(
        file.type as (typeof CHALAN_IMAGE_TYPES)[number],
      )
    ) {
      toast.error('Only JPG or PNG images are allowed');
      clearInputs();
      return;
    }

    if (file.size > MAX_CHALAN_FILE_BYTES) {
      toast.error('File size must be 5 MB or less');
      clearInputs();
      return;
    }

    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelected(file);
    e.target.value = '';
  };

  const handleRemove = () => {
    clearInputs();
    onChange(undefined);
  };

  return (
    <div className='space-y-2'>
      <input
        ref={galleryInputRef}
        type='file'
        accept={ACCEPT}
        onChange={handleInputChange}
        className='hidden'
        disabled={disabled}
        aria-hidden
      />
      <input
        ref={cameraInputRef}
        type='file'
        accept={ACCEPT}
        capture='environment'
        onChange={handleInputChange}
        className='hidden'
        disabled={disabled}
        aria-hidden
      />

      {value && previewUrl ? (
        <div className='flex items-center gap-3 rounded-lg border p-3'>
          <img
            src={previewUrl}
            alt='Chalan photo preview'
            className='h-14 w-14 shrink-0 rounded-md object-cover'
          />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>{value.name}</p>
            <p className='text-xs text-muted-foreground'>
              {formatFileSize(value.size)}
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon-sm'
            onClick={handleRemove}
            disabled={disabled}
            aria-label='Remove photo'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-2 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='min-h-11 flex-1 justify-center gap-2'
            onClick={() => cameraInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className='h-4 w-4' />
            Take photo
          </Button>
          <Button
            type='button'
            variant='outline'
            className='min-h-11 flex-1 justify-center gap-2'
            onClick={() => galleryInputRef.current?.click()}
            disabled={disabled}
          >
            <Image className='h-4 w-4' />
            Choose from gallery
          </Button>
        </div>
      )}

      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}
