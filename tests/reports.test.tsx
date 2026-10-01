import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { Workbook } from 'exceljs';
import { renderToBuffer, Text } from '@react-pdf/renderer';
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { FormXVIPDF } from '@/components/pdf/FormXVIPDF';
import { ReportTotalsRow } from '@/components/pdf/ReportTotalsRow';
import { PFReportPDF } from '@/components/pdf/PFReportPDF';
import { AllowanceSlipPDF } from '@/components/pdf/AllowanceSlipPDF';
import { LeaveChecklistPDF } from '@/components/pdf/LeaveChecklistPDF';
import { WagesPaySlipPDF } from '@/components/pdf/WagesPaySlipPDF';
import { WagesSlipBundlePDF } from '@/components/pdf/WagesSlipBundlePDF';
import { computePayment } from '@/lib/paymentCalculation';
import { formatMoney2, roundHalfUp2, roundNearestInteger } from '@/lib/moneyRounding';
import { reportTotals, signingWidths, wageRegisterColumns } from '@/lib/reportPolicy';
import { finishReportTable } from '@/lib/excelUtils';
import { Form17PDF, type Form17Row } from '@/components/pdf/Form17PDF';
import { ArrearPDF } from '@/components/pdf/ArrearPDF';
import { ESICReportPDF } from '@/components/pdf/ESICReportPDF';
import { BankStatementPTAPDF } from '@/components/pdf/BankStatementPTAPDF';
import { LeavePaymentRegisterPDF } from '@/components/pdf/LeavePaymentRegisterPDF';
import { generateForm17Excel } from '@/lib/excel/generateForm17Excel';
import { generateArrearExcel } from '@/lib/excel/generateArrearExcel';
import { generateESICReportExcel } from '@/lib/excel/generateESICReportExcel';
import { generatePFReportExcel } from '@/lib/excel/generatePFReportExcel';
import { generateWagesRegisterExcel } from '@/lib/excel/generateWagesRegisterExcel';
import { generateAllowanceSlipExcel } from '@/lib/excel/generateAllowanceSlipExcel';
import { generateFormXVIExcel } from '@/lib/excel/generateFormXVIExcel';
import { generateBonusRegisterExcel } from '@/lib/excel/generateBonusRegisterExcel';
import { generateLeavePaymentRegisterExcel } from '@/lib/excel/generateLeavePaymentRegisterExcel';
import { generateBonusChecklistExcel } from '@/lib/excel/generateBonusChecklistExcel';
import { generateLeaveChecklistExcel } from '@/lib/excel/generateLeaveChecklistExcel';
import { buildBonusRegisterData } from '@/lib/buildBonusRegisterData';
import type { BonusChecklistData } from '@/lib/buildBonusChecklistData';
import { buildFullAndFinalData } from '@/lib/buildFullAndFinalData';
import { generateFullAndFinalExcel } from '@/lib/excel/generateFullAndFinalExcel';
import { FullAndFinalPDF } from '@/components/pdf/FullAndFinalPDF';
import { BonusRegisterPDF } from '@/components/pdf/BonusRegisterPDF';
import { BonusChecklistPDF } from '@/components/pdf/BonusChecklistPDF';
import { buildForm17Data } from '@/lib/generateForm17';
import type { Employee, Wages, Designation } from '@/types';

assert.equal(roundNearestInteger(100.49), 100);
assert.equal(roundNearestInteger(100.50), 101);
assert.equal(roundHalfUp2(1.005), 1.01);
assert.equal(formatMoney2(720), '720.00');
const payment = computePayment(1.5, 500.25, 220.15, 12.34, 1.4, 4.567, 10.49);
assert.equal(payment.resultant1, 1080.6);
assert.equal(payment.resultant2, 1098.91);
assert.equal(payment.otherCash, 12.34);
assert.equal(payment.otherDeduction, 10.49);
assert.equal(payment.overtime, 4.57);
assert.equal(payment.pf, 130);
assert.equal(payment.esi, 8);
assert.equal(payment.netPayment, 950);
assert.equal(computePayment(30, 1000, 0, 0, 0, 0, 0, true).pf, 1800);
assert.equal(computePayment(30, 1000, 0, 0, 0, 0, 0, false).pf, 3600);
assert.equal(computePayment(0, 0, 0, 0, 0, 0, 0).netPayment, 0);
const totals = reportTotals([{ pf: 1.49, grossWages: 1.005, daysWorked: .5 }, { pf: 1.49, grossWages: 1.005, daysWorked: 1 }], wageRegisterColumns);
assert.equal(totals.pf, 2);
assert.equal(totals.grossWages, 2.02);
assert.equal(totals.daysWorked, 1.5);
assert.ok(!('payRate' in totals));
const widths = signingWidths(Array(19).fill(1), 821.89, [16, 18], [17]);
assert.equal(widths[16], 90);
assert.equal(widths[17], 60);
assert.ok(Math.abs(widths.reduce((a,b)=>a+b,0) - 821.89) < .000001);

const book = new Workbook();
const sheet = book.addWorksheet('Test');
sheet.addRow(['Name','Amount','PF','Days','Rate','Sign']);
sheet.addRow(['A',1.005,1.49,.5,720,'']);
sheet.addRow(['B',1.005,1.49,1,720,'']);
finishReportTable(sheet,2,3,[{column:2,kind:'money'},{column:3,kind:'wholeMoney'},{column:4,kind:'days'},{column:5,kind:'rate'},{column:6,kind:'signature'}],4,1);
assert.equal(sheet.getCell(4,2).value,2.02);
assert.equal(sheet.getCell(4,3).value,2);
assert.equal(sheet.getCell(4,4).value,1.5);
assert.equal(sheet.getCell(4,5).value,'');
assert.equal(sheet.getColumn(6).width,24);
assert.equal(sheet.getRow(2).height,32);

// Capture the actual serialized download without opening a browser or saving payroll.
let downloaded: Blob;
const originalURL = URL.createObjectURL;
URL.createObjectURL = blob => { downloaded = blob as Blob; return 'blob:test'; };
URL.revokeObjectURL = () => {};
Object.assign(globalThis, { document: { createElement: () => ({ click() {} }) } });
async function exportSheet(action: () => Promise<void>) {
  await action();
  const workbook = new Workbook();
  await workbook.xlsx.load(Buffer.from(await downloaded.arrayBuffer()));
  return workbook.worksheets[0];
}
const row: Form17Row = { employeeName: 'Alice Example', workmanNo: '001', designation: 'Operator', daysWorked: 1.5, basicRate: 500.25, daRate: 220.15, basicAmount: 750.38, daAmount: 330.23, otherCash: 12.34, allowances: 1.4, incentiveAmount: 4.57, grossWages: 1098.91, pf: 130, esi: 8, otherDeduction: 10.49, netAmountPaid: 950 };
const rows = [row, {...row, employeeName: 'Bob Example', workmanNo: '002'}];
const form = { rows, establishmentNameAddress:'Work Order', workNameLocation:'Test Site', principalEmployerNameAddress:'Employer', month:10, year:2026 };
const formSheet = await exportSheet(() => generateForm17Excel(form));
assert.equal(formSheet.getCell(7,7).value,'500.25 + 220.15 = 720.40');
assert.equal(formSheet.getCell(7,7).numFmt,'0.00');
assert.equal(formSheet.getCell(9,5).value,3);
assert.equal(formSheet.getCell(9,12).value,2197.82);
assert.equal(formSheet.getCell(9,16).value,1900);
assert.equal(formSheet.getCell(9,7).value,'');
assert.equal(formSheet.getColumn(17).width,24);
assert.equal(formSheet.getRow(7).height,32);
await writeFile('.cache/report-tests/form17.xlsx', Buffer.from(await downloaded.arrayBuffer()));
const emptyFormSheet = await exportSheet(() => generateForm17Excel({...form, rows:[]}));
assert.equal(emptyFormSheet.getCell(7,2).value,'Total');
assert.equal(emptyFormSheet.getCell(7,12).value,0);
const arrear = {...form, fromMonth:1, fromYear:2026, toMonth:10, toYear:2026};
const arrearSheet = await exportSheet(() => generateArrearExcel(arrear));
assert.equal(arrearSheet.getCell(9,12).value,2197.82);
const esiRows = rows.map((r,i)=>({slNo:i+1,ipNumber:'1234567890',ipName:r.employeeName,daysPaid:r.daysWorked,totalMonthlyWage:r.grossWages}));
const esiSheet = await exportSheet(() => generateESICReportExcel({rows:esiRows,month:10,year:2026}));
assert.equal(esiSheet.getCell(5,5).value,2197.82);
assert.equal(esiSheet.getCell(5,4).value,3);
const pfRows = rows.map(r=>({uan:'123456789012',employeeName:r.employeeName,epfWagesGross:1080.61,epfWages:1080.61,epsWages:1080.61,edliWages:1080.61,pf:r.pf,epfAmount:90,ppfAmount:40,ncpDays:1.5,lastColumn:0}));
const pfSheet = await exportSheet(() => generatePFReportExcel({rows:pfRows,month:10,year:2026}));
assert.equal(pfSheet.getCell(5,3).value,2161.22);
assert.equal(pfSheet.getCell(5,7).value,260);
const slips = rows.map(r=>({...r,accountNumber:'12345',uan:'123456789012',esicNo:'1234567890',natureOfWork:'Operator',month:10,year:2026,payRate:720.4,advanceDeduction:0,damageDeduction:0,raw:{pf:129.672,esi:8.24,otherCash:12.34,otherDeduction:10.49,netAmountPaid:950.49}}));
const wagesSheet = await exportSheet(() => generateWagesRegisterExcel(slips,10,2026));
assert.equal(wagesSheet.getCell(6,14).value,1900);
const allowance = { ...form, contractorNameAddress:'Contractor', rows:rows.map((r,i)=>({slNo:i+1,employeeName:r.employeeName,employeeCode:r.workmanNo,presentDays:r.daysWorked,nh:1,hra:10.49,monthlyMobileAllowance:0,monthlyIncumbentAllowance:0,earnedOtherCash:12.34,performanceBonus:0,washingAllowance:0,conveyanceAllowance:0,medicalAllowance:0,siteSpecificAllowance:0,otherAllowance:1.4,grandTotal:24.23})) };
const allowanceSheet = await exportSheet(() => generateAllowanceSlipExcel(allowance));
assert.equal(allowanceSheet.getCell(7,16).value,48.46);
const muster = {month:10,year:2026,location:'Site',employer:'Employer',rows:rows.map((r,i)=>({serialNo:i+1,name:r.employeeName,fatherName:'Father',sex:'M',days:Array(31).fill('P'),totalAttendance:1.5,remarks:''}))};
const musterSheet = await exportSheet(() => generateFormXVIExcel(muster));
assert.equal(musterSheet.getCell(7,36).value,3);
const checklist: BonusChecklistData = {fyEndYear:2026,fyLabel:'2025-2026',periodFromDisplay:'01/04/2025',periodToDisplay:'31/03/2026',contractorName:'Contractor',contractorOfficeLine:'Office',contractorCorrespondingLine:'Address',orderNumber:'WO1',rows:rows.map(r=>({employeeId:r.workmanNo,workManNo:r.workmanNo,employeeName:r.employeeName,months:Array.from({length:12},(_,i)=>({month:i+1,year:2026,label:String(i+1),days:1.5,amount:10.49})),arrear:2.34,total:128.22,payRate:720.4,daysWorkedYear:30}))};
const bonus = buildBonusRegisterData({checklist,employees:[],designations:[],bonusPercentage:8.33});
assert.equal(bonus.rows[0].amountOfBonusPayable,10.68);
assert.equal(bonus.rows[0].netPayableAmount,11);
const bonusSheet = await exportSheet(() => generateBonusRegisterExcel(bonus,'Bonus'));
assert.equal(bonusSheet.getCell(9,13).value,22);
assert.equal(bonusSheet.getColumn(16).width,24);
const checklistSheet = await exportSheet(() => generateBonusChecklistExcel(checklist,'Bonus','Bonus'));
const checklistTotal = checklistSheet.getRows(1,checklistSheet.rowCount)!.find(r=>r.getCell(3).value==='Total')!;
assert.ok(checklistTotal);
assert.equal(checklistTotal.getCell(5).value,20.98);
const leaveRow = {employeeId:'1',employeeName:'Alice',workmanNo:'001',designationNature:'Operator',daysCl:1.5,daysEl:2,daysFl:1,daysLeaveTotal:4.5,basicRate:500.25,daRate:220.15,rateTotal:720.4,sumBasicWages:750.38,sumDa:330.23,sumOvertime:0,sumOtherCashPayment:12.34,sumTotalWages:1098.91,sumPf:130,sumEsi:8,sumOthersDeduction:10.49,sumNetPaid:950,remarks:''};
const leave = {calendarYear:2026,periodFromDisplay:'01/01/2026',periodToDisplay:'31/12/2026',companyName:'Contractor',officeLine:'Office',correspondingLine:'Address',natureLocationOfWork:'Site',workOrderNumber:'WO1',establishmentNameAddress:'Establishment',principalEmployerNameAddress:'Employer',rows:[leaveRow,{...leaveRow,employeeId:'2',employeeName:'Bob'}]};
const leaveSheet = await exportSheet(() => generateLeavePaymentRegisterExcel(leave,'Leave'));
assert.equal(leaveSheet.getCell(16,16).value,1900);
assert.equal(leaveSheet.getCell(16,11).value,24.68);
assert.equal(typeof leaveSheet.getCell(14,8).value,'number');
const leaveChecklist = {calendarYear:2026,periodFromDisplay:'01/01/2026',periodToDisplay:'31/12/2026',orderNumber:'WO1',companyName:'Contractor',officeLine:'Office',correspondingLine:'Address',natureLocationOfWork:'Site',contractorPartyText:'Contractor',principalEmployerText:'Employer',rows:rows.map(r=>({employeeId:r.workmanNo,workManNo:r.workmanNo,employeeName:r.employeeName,fathersName:'Father',sex:'M',months:Array.from({length:12},(_,i)=>({month:i+1,label:String(i+1),presentDays:1.5})),totalPresent:18,totalEL:0,totalCL:1,totalFL:0,totalLeave:1,remarks:''}))};
const leaveChecklistSheet = await exportSheet(() => generateLeaveChecklistExcel(leaveChecklist,'Leave'));
const leaveChecklistTotal = leaveChecklistSheet.getRows(1,leaveChecklistSheet.rowCount)!.find(r=>r.getCell(2).value==='Total')!;
assert.equal(leaveChecklistTotal.getCell(5).value,3);
const employee = {id:'1',code:'001',name:'Alice',designation:'d',workManNo:'001'} as Employee;
const wage = {id:'w1',employee:'1',workOrderHr:'wo',year:2026,month:10,attendance:1.5,basic:500.25,da:220.15,otherCash:12.34,allowances:1.4,otherDeduction:10.49} as Wages;
const designation = {id:'d',designation:'Operator',basic:'500.25',da:'220.15'} as Designation;
const builtForm = buildForm17Data({employees:[employee],wages:[wage],attendances:[],workOrders:[],designations:[designation],month:10,year:2026,workOrderId:'wo',location:'Site',employer:'Employer'});
assert.equal(builtForm.rows[0].basicRate,500.25);
assert.equal(builtForm.rows[0].otherDeduction,10.49);
assert.equal(builtForm.rows[0].allowances,1.4);
const settlement = buildFullAndFinalData({employee,wages:[wage],attendances:[],workOrders:[],designations:[designation],finalSettlements:[],retrenchmentBenefit:false,fromDate:'2026-01-01',toDate:'2026-10-31',previousYearLeaveCleared:true,previousYearBonusCleared:true,makeBalanceAttendanceEntry:true,modeOfSeparation:'Resignation by Workman',deductions:[{label:'Advance',amount:10.49}]});
assert.ok(Number.isInteger(settlement.netPayable));
const settlementSheet = await exportSheet(() => generateFullAndFinalExcel(settlement,'Settlement'));
const settlementTotals = settlementSheet.getRows(1,settlementSheet.rowCount)!.filter(r=>r.getCell(1).value==='Total');
assert.equal(settlementTotals.length,2);
assert.equal(settlementTotals[0].getCell(11).value,1.5);
URL.createObjectURL = originalURL;

// Verify the Form XVI header has precisely its 37 cells and the total is a
// separate final row. Rendering alone does not catch a valid but distorted tree.
function descendants(node: ReactNode): ReactElement<{ children?: ReactNode; style?: Record<string, unknown> }>[] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode; style?: Record<string, unknown> }>(child)) return [];
    return [child, ...descendants(child.props.children)];
  });
}
const musterTree = FormXVIPDF({data:muster});
const musterNodes = descendants(musterTree);
const headerRows = musterNodes.filter(node => node.props.style?.fontFamily === 'Helvetica-Bold' && node.props.style?.flexDirection === 'row');
assert.equal(headerRows.length,2);
const headerCells = Children.toArray(headerRows[1].props.children);
assert.equal(headerCells.length,37);
assert.ok(headerCells.every(cell => isValidElement(cell) && cell.type === Text));
const totalNodes = musterNodes.filter(node => node.type === ReportTotalsRow);
assert.equal(totalNodes.length,1);
const table = musterNodes.find(node => Children.toArray(node.props.children).some(child => isValidElement(child) && child.type === ReportTotalsRow))!;
assert.equal((Children.toArray(table.props.children).at(-1) as ReactElement).type,ReportTotalsRow);

{
  const many = Array.from({length:35},(_,i)=>({...row,employeeName:`Employee ${i+1} Long Name`,workmanNo:String(i+1)}));
  const bank = {month:10,year:2026,totalAmount:19000,rows:Array.from({length:20},(_,i)=>({serialNo:i+1,workManNo:String(i+1),name:'Employee '+(i+1),bankAccount:'123456789012',ifsc:'TEST0001234',netAmount:950}))};
  const documents = [
    ['form16',<FormXVIPDF data={{...muster,rows:Array.from({length:60},(_,i)=>({...muster.rows[0],serialNo:i+1,name:`Employee ${i+1} Long Name`,fatherName:'DURGA PRA MANIK',remarks:'P: 26, A: 0, O: 4, EL: 0, CL: 0, FL: 0, HD: 0, NH: 0',totalAttendance:i===0?25.5:26}))}} />],
    ['form16-empty',<FormXVIPDF data={{...muster,rows:[]}} />],
    ['form17',<Form17PDF {...form} rows={many} />],
    ['arrear',<ArrearPDF {...arrear} />],
    ['esi',<ESICReportPDF rows={esiRows} month={10} year={2026} />],
    ['bank',<BankStatementPTAPDF data={bank} />],
    ['leave',<LeavePaymentRegisterPDF data={leave} />],
    ['bonus',<BonusRegisterPDF data={bonus} />],
    ['bonus-checklist',<BonusChecklistPDF data={checklist} documentTitle="Bonus Checklist" />],
    ['settlement',<FullAndFinalPDF data={settlement} />],
    ['pf',<PFReportPDF rows={pfRows} month={10} year={2026} />],
    ['allowance',<AllowanceSlipPDF data={allowance} />],
    ['leave-checklist',<LeaveChecklistPDF data={leaveChecklist} />],
    ['wages-slip',<WagesPaySlipPDF data={slips[0]} />],
    ['wages-bundle',<WagesSlipBundlePDF slips={slips} />],
  ] as const;
  for (const [name,document] of documents) {
    const buffer = await renderToBuffer(document);
    assert.ok(buffer.length > 0,`${name} must render successfully`);
    if (process.env.REPORT_VISUAL_QA === '1') await writeFile(`.cache/report-tests/${name}.pdf`,buffer);
  }
}
console.log('Payroll rounding, displayed-value totals, signature sizing, Excel exports, Form XVI header structure, and all PDF template renders passed.');
