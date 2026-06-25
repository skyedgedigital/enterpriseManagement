import { forwardRef } from 'react';

interface Props {
  id: string;
  children: React.ReactNode;
}

export const InvoicePrintLayout = forwardRef<HTMLDivElement, Props>(
  ({ id, children }, ref) => (
    <div
      id={id}
      ref={ref}
      className='border border-gray-700 p-4 text-[0.75rem] font-semibold tracking-wider'
      style={{ width: '100%' }}
    >
      {children}
    </div>
  ),
);
InvoicePrintLayout.displayName = 'InvoicePrintLayout';
