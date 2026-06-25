import { forwardRef } from 'react';
import type {
  MergedInvoiceItem,
  EnterpriseInfo,
  FleetWorkOrder,
} from '@/types';
import { numberToWords, todayFormatted } from '@/lib/fleet-manager/invoiceHelpers';

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

export const PHSInvoice = forwardRef<HTMLDivElement, Props>(
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
      className='border border-gray-700 p-4 text-[0.75rem] font-semibold tracking-wider w-full'
    >
      <h1 className='text-center text-lg font-bold'>PROFORMA INVOICE</h1>

      {/* Company header */}
      <div className='flex flex-col gap-1 my-2'>
        <p className='text-lg uppercase font-bold'>{enterprise.name}</p>
        <p className='border-b border-black pb-1'>
          Specialist in: Horticulture, Conservancy Services, Supply of
          Equipments
        </p>
        <p className='font-normal'>Address: {enterprise.address}</p>
        <p>Mobile: {enterprise.mobile}</p>
        <p className='font-normal'>Email: {enterprise.email}</p>
        <p className='font-normal uppercase'>GSTIN/UN: {enterprise.gstin}</p>
        <p className='font-normal uppercase'>PAN: {enterprise.pan}</p>
      </div>

      {/* Billing + meta side by side */}
      <div className='flex flex-wrap gap-4 my-3 overflow-x-auto'>
        {/* Customer block */}
        <table className='border border-black'>
          <tbody>
            {[
              [
                'Customer Name:',
                'TATA STEEL UTILITIES AND INFRASTRUCTURE SERVICES LIMITED',
              ],
              [
                'Address:',
                'CFO, Through CDM-PHS Sakchi Boulevard Road, Bistupur Jamshedpur - 831001',
              ],
              ['GSTIN/UN:', enterprise.gstin],
              ['Place of Supply:', location],
              ['State Code:', 'Jharkhand - 20'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className='border border-black p-1 font-bold whitespace-nowrap'>
                  {label}
                </td>
                <td className='border border-black p-1 font-normal max-w-xs'>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Invoice meta */}
        <table className='border border-black'>
          <tbody>
            {[
              ['Ref Performa Invoice no:', invoiceNumber || 'N/A'],
              ['Date of Issue:', todayFormatted()],
              ['Vendor code:', enterprise.vendorCode],
              ['WO/PO No:', workOrder?.workOrderNumber ?? '—'],
              ['Do No:', '—'],
              ['SES No:', '—'],
              ['Location:', location],
              ['Period of service:', servicePeriod],
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
      </div>

      {/* Items table */}
      <div className='overflow-x-auto border border-black'>
        <table className='w-full border-collapse'>
          <thead>
            <tr>
              {[
                'SL',
                'HSN',
                'Description of Goods/Services',
                'Quantity',
                'UOM',
                'Rate',
                'Value',
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
                <td className='border border-black p-1'>{item.hsnNo}</td>
                <td className='border border-black p-1'>{item.itemName}</td>
                <td className='border border-black p-1'>
                  {item.hours.toFixed(2)}
                </td>
                <td className='border border-black p-1'>{item.unit}</td>
                <td className='border border-black p-1'>
                  {item.itemPrice.toFixed(2)}
                </td>
                <td className='border border-black p-1'>
                  {item.itemCost.toFixed(2)}
                </td>
              </tr>
            ))}
            {[
              ['Total', total.toFixed(2)],
              ['CGST (9%)', cgst.toFixed(2)],
              ['SGST (9%)', sgst.toFixed(2)],
              ['Grand Total', `${grandTotal.toFixed(2)} INR`],
            ].map(([label, value]) => (
              <tr key={label}>
                {[...Array(5)].map((_, i) => (
                  <td key={i} className='border border-black p-1'></td>
                ))}
                <td className='border border-black p-1 font-bold'>{label}</td>
                <td className='border border-black p-1 font-bold'>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className='p-1'>
          Amount chargeable under Reverse Charge Mechanism - NO
        </p>
      </div>

      {/* Words + signature */}
      <div className='flex justify-between mt-2 border border-black p-2'>
        <p>
          Rupees in words:{' '}
          <span className='uppercase'>{numberToWords(grandTotal)} only</span>
        </p>
        <div className='text-right font-bold'>
          <p>FOR M/s {enterprise.name}</p>
          <p className='mt-6'>Authorised Signatory</p>
        </div>
      </div>

      {/* Service feedback table */}
      <table className='border border-black mt-3'>
        <thead>
          <tr>
            <th className='border border-black p-1'>Service User Feedback</th>
            {['P', 'F', 'G', 'VG', 'EX'].map((h) => (
              <th key={h} className='border border-black p-1'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            'Quality of Services',
            'Safety Compliance',
            'Timely Delivery',
            'Timely bill submission',
            'Responsiveness',
            'Resources deployed',
            'Statutory Compliance',
          ].map((label) => (
            <tr key={label}>
              <td className='border border-black p-1'>{label}</td>
              {[...Array(5)].map((_, i) => (
                <td key={i} className='border border-black p-1 w-6'></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className='mt-1 border border-black p-2'>
        Signature of Concerned Office
      </p>
    </div>
  ),
);
PHSInvoice.displayName = 'PHSInvoice';
