import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./pdfStyles";
import { formatMonthYear } from "@/lib/pdfUtils";
import type { PFReportRow } from "@/lib/generatePFReport";

interface PFReportPDFProps {
  rows: PFReportRow[];
  year: number;
  month: number;
  departmentName?: string;
}

// A4 content width after page padding (30*2) and pageBorder padding (16*2) ≈ 503pt
const TABLE_TOTAL_WIDTH = 503;
const COL_WIDTHS = {
  uan: 72,
  name: 98,
  epf1: 40,
  epf2: 40,
  eps: 40,
  edli: 40,
  pf: 40,
  epfAmt: 40,
  ppfAmt: 40,
  ncp: 32,
  last: 21,
};

export function PFReportPDF({ rows, year, month, departmentName }: PFReportPDFProps) {
  const title = `PF Report - ${formatMonthYear(month, year)}${departmentName ? ` - ${departmentName}` : ""}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.pageBorder}>
          <View style={[s.headerRow, { marginBottom: 12 }]}>
            <Text style={s.headerLeft}>PF Challan / Report</Text>
            <Text style={s.headerCenter}>{title}</Text>
            <Text style={s.headerRight} />
          </View>

          <View style={[s.table, { width: TABLE_TOTAL_WIDTH }]}>
            {/* Header row */}
            <View style={[s.tableHeader, { width: TABLE_TOTAL_WIDTH }]}>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.uan }]}>
                <Text>UAN</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.name }]}>
                <Text>Employee Name</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.epf1 }]}>
                <Text>EPF Wages</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.epf2 }]}>
                <Text>EPF Wages</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.eps }]}>
                <Text>EPS Wages</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.edli }]}>
                <Text>EDLI Wages</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.pf }]}>
                <Text>PF Amount</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.epfAmt }]}>
                <Text>EPF Amount</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.ppfAmt }]}>
                <Text>PPF Amount</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.ncp }]}>
                <Text>NCP Days</Text>
              </View>
              <View style={[s.tableHeaderCell, { width: COL_WIDTHS.last }]}>
                <Text />
              </View>
            </View>

            {rows.map((row, index) => (
              <View
                key={`${row.uan}-${index}`}
                style={[
                  s.tableRow,
                  { width: TABLE_TOTAL_WIDTH },
                  ...(index % 2 === 1 ? [s.tableRowAlt] : []),
                ]}
              >
                <View style={[s.tableCell, { width: COL_WIDTHS.uan }]}>
                  <Text>{row.uan}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.name }]}>
                  <Text>{row.employeeName}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.epf1 }, s.textRight]}>
                  <Text>{row.epfWagesGross}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.epf2 }, s.textRight]}>
                  <Text>{row.epfWages}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.eps }, s.textRight]}>
                  <Text>{row.epsWages}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.edli }, s.textRight]}>
                  <Text>{row.edliWages}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.pf }, s.textRight]}>
                  <Text>{row.pf}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.epfAmt }, s.textRight]}>
                  <Text>{row.epfAmount}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.ppfAmt }, s.textRight]}>
                  <Text>{row.ppfAmount}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.ncp }, s.textRight]}>
                  <Text>{row.ncpDays}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.last }, s.textRight]}>
                  <Text>{row.lastColumn}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
