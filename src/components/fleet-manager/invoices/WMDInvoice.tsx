import { forwardRef } from 'react';
import type {
  MergedInvoiceItem,
  EnterpriseInfo,
  FleetWorkOrder,
} from '@/types';

interface Props {
  id: string;
  invoiceNumber: string;
  workOrder: FleetWorkOrder | null;
  items: MergedInvoiceItem[];
  total: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  location: string;
  servicePeriod: string;
  enterprise: EnterpriseInfo;
}

export const WMDInvoice = forwardRef<HTMLDivElement, Props>(
  (
    {
      id,
      invoiceNumber,
      workOrder,
      items,
      total,
      cgst,
      sgst,
      grandTotal,
      location,
      servicePeriod,
      enterprise,
    },
    ref,
  ) => (
    <div
      id={id}
      ref={ref}
      className='border-2 border-black p-2 text-[0.75rem] font-semibold tracking-wider w-full'
    >
      {/* WMD Header */}
      <div className='flex justify-between mb-4'>
        <div className='flex flex-col items-center flex-1'>
          <h1 className='uppercase text-base'>Jusco LTD</h1>
          <h2 className='uppercase'>Water Management</h2>
          <p>JOB STATEMENT / PROFORMA INVOICE FORMAT</p>
          <p className='text-xs'>
            (For making DO & Service Entry Sheet for service job)
          </p>
        </div>
        <div className='text-right'>
          <p>From No:- WMD/Bill/01</p>
          <p>Effective Dt: 16.12.2018</p>
        </div>
      </div>

      {/* Meta grid */}
      <div className='flex gap-4 mb-4 overflow-x-auto'>
        {/* Left block */}
        <table className='border border-black w-1/2'>
          <tbody>
            {[
              ['Job Statement No:', invoiceNumber || 'N/A'],
              ['WO/PO no:', workOrder?.workOrderNumber ?? '—'],
              ["Vendor's name:", enterprise.name],
              ['Job Location:', location],
              ['Service Period:', servicePeriod],
              ['IO NO:', '—'],
              ['Billing Details:', 'As Below'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className='border border-black p-1 font-bold whitespace-nowrap'>
                  {label}
                </td>
                <td className='border border-black p-1 font-normal'>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Right block */}
        <table className='border border-black w-1/2'>
          <tbody>
            {[
              ['Date of Receipt in Bill section', '—'],
              ['DO No', '—'],
              ['SES Sheet No', '—'],
              ['Dt SESheet', '—'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className='border border-black p-1 font-bold'>{label}</td>
                <td className='border border-black p-1 font-normal'>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Items table */}
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              {[
                'SL',
                'SAP Line no',
                'SAC',
                'Job Description',
                'Unit',
                'Quantity',
                'Rate',
                'Amount',
              ].map((h) => (
                <th key={h} className='border border-black p-1'>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className='border border-black p-1'>{i + 1}</td>
                <td className='border border-black p-1'>—</td>
                <td className='border border-black p-1'>{item.hsnNo}</td>
                <td className='border border-black p-1'>{item.itemName}</td>
                <td className='border border-black p-1'>{item.unit}</td>
                <td className='border border-black p-1'>
                  {item.hours.toFixed(2)}
                </td>
                <td className='border border-black p-1'>
                  {item.itemPrice.toFixed(2)}
                </td>
                <td className='border border-black p-1'>
                  {item.itemCost.toFixed(2)}
                </td>
              </tr>
            ))}
            <tr>
              {[...Array(6)].map((_, i) => (
                <td key={i} className='border border-black p-1'></td>
              ))}
              <td className='border border-black p-1 font-bold'>Total</td>
              <td className='border border-black p-1'>{total.toFixed(2)}</td>
            </tr>
            <tr>
              {[...Array(6)].map((_, i) => (
                <td key={i} className='border border-black p-1'></td>
              ))}
              <td className='border border-black p-1'>Add CGST @9%</td>
              <td className='border border-black p-1'>{cgst.toFixed(2)}</td>
            </tr>
            <tr>
              {[...Array(6)].map((_, i) => (
                <td key={i} className='border border-black p-1'></td>
              ))}
              <td className='border border-black p-1'>Add SGST @9%</td>
              <td className='border border-black p-1'>{sgst.toFixed(2)}</td>
            </tr>
            <tr>
              {[...Array(6)].map((_, i) => (
                <td key={i} className='border border-black p-1'></td>
              ))}
              <td className='border border-black p-1 font-bold'>Grand Total</td>
              <td className='border border-black p-1 font-bold'>
                {grandTotal.toFixed(2)} INR
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signature boxes */}
      <div className='flex gap-4 mt-6 justify-between'>
        {[
          'JS Rcvd in Exe Sec',
          'Certified by Site Engg',
          'Certified by Mgr',
        ].map((label) => (
          <div key={label} className='flex-1 border border-black'>
            <div className='border-b border-black p-1'>Sign:</div>
            <div className='border-b border-black p-1'>Name:</div>
            <div className='border-b border-black p-1'>Date:</div>
            <div className='p-1'>{label}</div>
          </div>
        ))}
      </div>

      <div className='mt-4 p-2'>
        <p className='font-bold'>Note</p>
        <p>
          1. Attach / Put stamp for Vendor Evaluation with all Job Statement
        </p>
        <p>
          2. Before certifying Job statement, pls check PO balance Value,
          Validity & IO Budget
        </p>
      </div>
    </div>
  ),
);
WMDInvoice.displayName = 'WMDInvoice';
