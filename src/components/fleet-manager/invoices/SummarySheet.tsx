import { forwardRef } from 'react';
import type { InvoiceSummaryByItem } from '@/types';
import { format } from 'date-fns';

interface Props {
  id: string;
  invoiceNumber: string;
  summaryData: InvoiceSummaryByItem[];
}

export const SummarySheet = forwardRef<HTMLDivElement, Props>(
  ({ id, invoiceNumber, summaryData }, ref) => {
    const rows: React.ReactNode[] = [];
    let grandTotal = 0;

    summaryData.forEach((group) => {
      let groupTotal = 0;
      group.details.forEach((item, idx) => {
        groupTotal += item.workingHour;
        rows.push(
          <tr key={`${group.itemDescription}-${idx}`}>
            <td className='border border-black py-1 text-center'>{idx + 1}</td>
            <td className='border border-black py-1 text-center'>
              {group.itemDescription}
            </td>
            <td className='border border-black py-1 text-center'>
              {item.chalanNumber}
            </td>
            <td className='border border-black py-1 text-center'>
              {format(item.chalanDate, 'dd/MM/yyyy')}
            </td>
            <td className='border border-black py-1 text-center'>
              {item.location || '—'}
            </td>
            <td className='border border-black py-1 text-center'>
              {item.workingHour.toFixed(2)}
            </td>
          </tr>,
        );
      });
      grandTotal += groupTotal;
      rows.push(
        <tr key={`subtotal-${group.itemDescription}`} className='bg-gray-200'>
          <td className='border border-black py-1 text-center'>—</td>
          <td className='border border-black py-1 text-center'>—</td>
          <td className='border border-black py-1 text-center'>—</td>
          <td className='border border-black py-1 text-center'>—</td>
          <td className='border border-black py-1 text-center font-bold'>
            Item Total
          </td>
          <td className='border border-black py-1 text-center'>
            {groupTotal.toFixed(2)}
          </td>
        </tr>,
      );
    });

    rows.push(
      <tr key='grand-total' className='bg-gray-300'>
        <td className='border border-black py-1 text-center'>—</td>
        <td className='border border-black py-1 text-center'>—</td>
        <td className='border border-black py-1 text-center'>—</td>
        <td className='border border-black py-1 text-center'>—</td>
        <td className='border border-black py-1 text-center font-bold'>
          Total
        </td>
        <td className='border border-black py-1 text-center font-bold'>
          {grandTotal.toFixed(2)}
        </td>
      </tr>,
    );

    return (
      <div id={id} ref={ref} className='w-full p-4'>
        <h2 className='mb-4 text-center text-base font-bold'>
          Invoice no. <span className='tracking-wide'>{invoiceNumber}</span> —
          Summary Sheet
        </h2>
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse text-sm'>
            <thead>
              <tr>
                {[
                  'Sl no.',
                  'Description',
                  'Chalan No.',
                  'Date',
                  'Location',
                  'Working Duration',
                ].map((h) => (
                  <th
                    key={h}
                    className='border border-black py-1 text-center capitalize'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
      </div>
    );
  },
);
SummarySheet.displayName = 'SummarySheet';
