import { forwardRef } from 'react';
import type {
  MergedInvoiceItem,
  EnterpriseInfo,
  FleetWorkOrder,
} from '@/types';
import {
  numberToWords,
  todayFormatted,
  getInvoiceYear,
} from '@/lib/fleet-manager/invoiceHelpers';

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
  department: string;
  enterprise: EnterpriseInfo;
}

export const GenericInvoice = forwardRef<HTMLDivElement, Props>(
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
      department,
      enterprise,
    },
    ref,
  ) => (
    <div
      id={id}
      ref={ref}
      className='border border-gray-700 p-4 text-[0.75rem] font-semibold tracking-wider w-full'
    >
      {/* Header */}
      <div className='mb-2 flex flex-col gap-1'>
        <div className='flex items-center gap-2'>
          <p className='text-lg uppercase font-bold'>{enterprise.name}</p>
        </div>
        <p className='border-b border-black pb-1'>
          Specialist in: Horticulture, Conservancy Services, Supply of
          Equipments
        </p>
        <p className='font-normal'>Address: {enterprise.address}</p>
        <p>Mobile: {enterprise.mobile}</p>
        <p className='font-normal'>Email: {enterprise.email}</p>
      </div>

      <div className='border-2 border-black w-full pb-6'>
        <h1 className='py-1 text-center font-bold'>PROFORMA INVOICE</h1>

        {/* GSTIN / PAN strip */}
        <div className='flex justify-around border-t-2 border-b-2 border-gray-700 py-1'>
          <span>
            GST IN:{' '}
            <span className='font-normal uppercase'>{enterprise.gstin}</span>
          </span>
          <span>
            PAN: <span className='font-normal uppercase'>{enterprise.pan}</span>
          </span>
        </div>

        {/* Billing details */}
        <div className='flex flex-wrap justify-around gap-4 px-4 py-3 overflow-x-auto'>
          {/* Customer */}
          <div className='flex flex-col gap-1 min-w-52'>
            <h2 className='uppercase font-bold'>Customer Name & Address</h2>
            <p>To, The CFO</p>
            <p>Tata Steel UISL</p>
            <p>Through: {department}</p>
            <p>GSTIN/UN: {enterprise.gstin}</p>
            <p>Place of Supply: {location}</p>
            <p>STATE CODE: Jharkhand - 20</p>
          </div>
          {/* Invoice meta */}
          <div className='flex flex-col gap-1 min-w-52'>
            <p>
              Invoice no: SE/{getInvoiceYear()}/{invoiceNumber}
            </p>
            <p>Date of Issue: {todayFormatted()}</p>
            <p>Vendor code: {enterprise.vendorCode}</p>
            <p>WO/PO No: {workOrder?.workOrderNumber ?? '—'}</p>
            <p>Do No: —</p>
            <p>SES No: —</p>
            <p>Location: {location}</p>
            <p>Period of service: {servicePeriod}</p>
          </div>
        </div>

        {/* Work description */}
        <p className='border border-gray-600 p-1 text-center font-semibold'>
          {workOrder?.workDescription}
        </p>

        {/* Items table */}
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr>
                {[
                  'Item No',
                  'HSN/SAC',
                  'Description',
                  'Quantity',
                  'UOM',
                  'Rate (INR)',
                  'Value',
                  'CGST 9%',
                  'SGST 9%',
                  'CGST Amt',
                  'SGST Amt',
                ].map((h) => (
                  <th key={h} className='border border-black px-1 py-1'>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className='border border-black px-1'>
                    {item.itemNumber}
                  </td>
                  <td className='border border-black px-1'>{item.hsnNo}</td>
                  <td className='border border-black px-1'>{item.itemName}</td>
                  <td className='border border-black px-1'>
                    {item.hours.toFixed(2)}
                  </td>
                  <td className='border border-black px-1'>{item.unit}</td>
                  <td className='border border-black px-1'>
                    {item.itemPrice.toFixed(2)}
                  </td>
                  <td className='border border-black px-1'>
                    {item.itemCost.toFixed(2)}
                  </td>
                  <td className='border border-black px-1'>9%</td>
                  <td className='border border-black px-1'>9%</td>
                  <td className='border border-black px-1'>
                    {(0.09 * item.itemCost).toFixed(2)}
                  </td>
                  <td className='border border-black px-1'>
                    {(0.09 * item.itemCost).toFixed(2)}
                  </td>
                </tr>
              ))}
              {/* Total */}
              <tr>
                {[...Array(5)].map((_, i) => (
                  <td key={i} className='border border-black'></td>
                ))}
                <td className='border border-black px-1 font-bold'>Total</td>
                <td className='border border-black px-1'>{total.toFixed(2)}</td>
                <td className='border border-black'></td>
                <td className='border border-black'></td>
                <td className='border border-black px-1'>{cgst.toFixed(2)}</td>
                <td className='border border-black px-1'>{sgst.toFixed(2)}</td>
              </tr>
              {/* Grand Total */}
              <tr>
                {[...Array(9)].map((_, i) => (
                  <td key={i} className='border border-black'></td>
                ))}
                <td className='border border-black px-1 font-bold'>
                  Grand Total
                </td>
                <td className='border border-black px-1 font-bold'>
                  {grandTotal.toFixed(2)} INR
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words + signature */}
        <div className='flex justify-between mt-2 px-2'>
          <div>
            <p>
              Rupees in words:{' '}
              <span className='uppercase'>
                {numberToWords(grandTotal)} only
              </span>
            </p>
            <p>Tax payable under Reverse charge: No</p>
          </div>
          <div className='text-right font-bold'>
            <p>M/s {enterprise.name}</p>
            <p className='mt-4'>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  ),
);
GenericInvoice.displayName = 'GenericInvoice';
