import { Document, Text, View } from "@react-pdf/renderer";
import {
  PDFPage,
  PDFFormHeader,
  PDFContractorBlock,
  PDFFieldRow,
  PDFSection,
  PDFNumberedLine,
  PDFSignatureLine,
} from "./primitives";
import { pdfStyles as s } from "./pdfStyles";
import { formatINR, formatMonthYear } from "@/lib/pdfUtils";

export interface WagesPaySlipData {
  employeeName: string;
  workmanNo: string;
  accountNumber: string;
  uan: string;
  esicNo: string;
  natureOfWork: string;
  month: number;
  year: number;
  daysWorked: number;
  basicRate: number;
  daRate: number;
  payRate: number;
  basicAmount: number;
  daAmount: number;
  /** Whole rupees. */
  otherCash: number;
  grossWages: number;
  advanceDeduction: number;
  damageDeduction: number;
  /** Whole rupees. */
  pf: number;
  /** Whole rupees. */
  esi: number;
  incentiveAmount: number | null;
  /** Whole rupees. */
  netAmountPaid: number;
  /**
   * Raw unrounded PF / ESI / OtherDeduction / OtherCash / Net values.
   * Callers that aggregate multiple slips (e.g. Leave Payment Register)
   * should sum these and round once, rather than summing the already-rounded
   * display fields.
   */
  raw: {
    pf: number;
    esi: number;
    otherDeduction: number;
    otherCash: number;
    netAmountPaid: number;
  };
}

interface Props {
  data: WagesPaySlipData;
}

export function WagesPaySlipPage({ data }: Props) {
  const d = data;
  const formatRounded = (amount: number | undefined | null): string =>
    String(Math.round(amount ?? 0));

  return (
    <PDFPage>
      {/* ---- Header ---- */}
      <PDFFormHeader
        formNumber="FOR XIX"
        title="WAGES SLIP"
        ruleRef="[ See Rule 78 (2) (B) ]"
      />

      {/* ---- Contractor ---- */}
      <PDFContractorBlock />

      {/* ---- Contract Under section ---- */}
      <PDFSection title="Contract Under">
        {/* Row 1: Name + Workman No */}
        <PDFFieldRow
          fields={[
            { label: "Name of Workman :", value: d.employeeName, flex: 2 },
            { label: "Workman No", value: d.workmanNo },
          ]}
        />

        {/* Row 2: Nature of Work + A/c No */}
        <PDFFieldRow
          fields={[
            { label: "Nature & Location of Work :", value: d.natureOfWork, flex: 2 },
            { label: "A/c No.", value: d.accountNumber },
          ]}
        />

        {/* Row 3: Month + UAN */}
        <PDFFieldRow
          fields={[
            {
              label: "For the Month :",
              value: formatMonthYear(d.month, d.year),
              flex: 2,
            },
            { label: "UAN", value: d.uan },
          ]}
        />

        {/* Row 4: Empty left + ESIC No */}
        <PDFFieldRow
          fields={[
            { label: "", value: "", flex: 2 },
            { label: "ESIC No.", value: d.esicNo },
          ]}
        />
      </PDFSection>

      {/* ---- Numbered wage details ---- */}
      <View style={s.mt12}>
        {/* 1. Days Worked */}
        <PDFNumberedLine number={1} label="No. of Days Worked">
          <Text style={s.value}>{d.daysWorked}</Text>
        </PDFNumberedLine>

        {/* 2. Units worked (piece rate) */}
        <PDFNumberedLine number={2} label="No. of Units Worked in Case of Piece Rate of Work">
          <Text style={s.label}>-</Text>
        </PDFNumberedLine>

        {/* 3. Rate of Daily Wages */}
        <PDFNumberedLine number={3} label="Rate of Daily Wages @ Piece Rate">
          <Text style={s.value}>
            {formatRounded(d.basicRate)}    +    {formatRounded(d.daRate)}    =    {formatRounded(d.payRate)}
          </Text>
        </PDFNumberedLine>

        {/* 4. Amount of Wages */}
        <PDFNumberedLine number={4} label="Amount of Wages">
          <Text style={s.value}>
            {formatRounded(d.basicAmount)}    +    {formatRounded(d.daAmount)}    +    {formatRounded(d.otherCash)}
          </Text>
        </PDFNumberedLine>

        {/* 5. Overtime */}
        <PDFNumberedLine number={5} label="Amount of Overtime Wages">
          <Text style={s.label} />
        </PDFNumberedLine>

        {/* 6. Gross Wages */}
        <PDFNumberedLine number={6} label="Gross Wages Payable">
          <Text style={s.value}>{formatINR(d.grossWages)}</Text>
        </PDFNumberedLine>

        {/* 7. Deductions */}
        <View style={[s.row, s.mb4, { flexWrap: "wrap" }]}>
          <Text style={s.label}>7. Deduction if Any Advance : </Text>
          <Text style={s.value}>{formatRounded(d.advanceDeduction)}    </Text>
          <Text style={s.label}>Deduction if Any Damage : </Text>
          <Text style={s.value}>{formatRounded(d.damageDeduction)}    </Text>
          <Text style={s.label}>PF:    </Text>
          <Text style={s.value}>{formatRounded(d.pf)}    </Text>
          <Text style={s.label}>ESI:    </Text>
          <Text style={s.value}>{formatRounded(d.esi)}</Text>
        </View>

        {/* 8. Incentive */}
        <PDFNumberedLine number={8} label="Total Incentive amount">
          <Text style={s.value}>
            {d.incentiveAmount != null ? formatRounded(d.incentiveAmount) : "NA"}
          </Text>
        </PDFNumberedLine>

        {/* 9. Net Amount */}
        <PDFNumberedLine number={9} label="Net Amount of Wages Paid">
          <Text style={s.value}>{formatRounded(d.netAmountPaid)}</Text>
        </PDFNumberedLine>
      </View>

      {/* ---- Signature ---- */}
      <PDFSignatureLine text="Initial of Contractor or his Representative" />
    </PDFPage>
  );
}

export function WagesPaySlipPDF({ data }: Props) {
  return (
    <Document>
      <WagesPaySlipPage data={data} />
    </Document>
  );
}
