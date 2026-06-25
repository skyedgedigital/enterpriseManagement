import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'type'>
>(({ className, disabled, id, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className='relative w-full'>
      <Input
        ref={ref}
        {...props}
        id={id}
        disabled={disabled}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
      />
      <Button
        type='button'
        variant='ghost'
        size='icon'
        disabled={disabled}
        tabIndex={-1}
        className='text-muted-foreground hover:text-foreground absolute right-0.5 top-1/2 h-8 w-8 -translate-y-1/2 shrink-0'
        aria-controls={id ?? undefined}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        onClick={(e) => {
          e.preventDefault();
          setVisible((v) => !v);
        }}
      >
        {visible ? (
          <EyeOff className='h-4 w-4' />
        ) : (
          <Eye className='h-4 w-4' />
        )}
      </Button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
