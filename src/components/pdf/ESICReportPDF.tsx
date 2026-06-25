import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles as s } from "./pdfStyles";
import { formatMonthYear } from "@/lib/pdfUtils";
import type { ESICReportRow } from "@/lib/generateESICReport";

interface ESICReportPDFProps {
  rows: ESICReportRow[];
  year: number;
  month: number;
  stateName?: string;
}

// A4 content width after page padding and pageBorder padding ≈ 503pt
const TABLE_TOTAL_WIDTH = 503;
const COL_WIDTHS = {
  slNo: 36,
  ipNumber: 70,
  ipName: 198,
  days: 72,
  wage: 127,
};

export function ESICReportPDF({ rows, year, month, stateName }: ESICReportPDFProps) {
  const title = `ESIC Report - ${formatMonthYear(month, year)}${stateName ? ` - ${stateName}` : ""}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.pageBorder}>
          <View style={[s.headerRow, { marginBottom: 12 }]}>
            <Text style={s.headerLeft}>ESIC Challan / Report</Text>
            <Text style={s.headerCenter}>{title}</Text>
            <Text style={s.headerRight} />
          </View>

          <View style={[s.table, { width: TABLE_TOTAL_WIDTH }]}>
            {/* Header row — multi-line labels, top-aligned, centered where needed */}
            <View style={[s.esicTableHeader, { width: TABLE_TOTAL_WIDTH }]}>
              <View style={[s.esicTableHeaderCell, { width: COL_WIDTHS.slNo }, s.tableCellCenter]}>
                <Text>Sl No.</Text>
              </View>
              <View style={[s.esicTableHeaderCell, { width: COL_WIDTHS.ipNumber }, s.tableCellCenter]}>
                <Text>IP Number{"\n"}(10 Digits)</Text>
              </View>
              <View style={[s.esicTableHeaderCell, { width: COL_WIDTHS.ipName }, s.tableCellCenter]}>
                <Text>IP Name{"\n"}(Alphabetical only)</Text>
              </View>
              <View style={[s.esicTableHeaderCell, { width: COL_WIDTHS.days }, s.tableCellCenter]}>
                <Text>No. of days for{"\n"}which wages{"\n"}paid/payable</Text>
              </View>
              <View style={[s.esicTableHeaderCell, { width: COL_WIDTHS.wage }, s.tableCellCenter]}>
                <Text>Total Monthly{"\n"}Wage</Text>
              </View>
            </View>

            {rows.map((row, index) => (
              <View
                key={`${row.ipNumber}-${index}`}
                style={[s.tableRow, { width: TABLE_TOTAL_WIDTH }]}
              >
                <View style={[s.tableCell, { width: COL_WIDTHS.slNo }, s.tableCellCenter]}>
                  <Text>{row.slNo}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.ipNumber }, s.tableCellCenter]}>
                  <Text>{row.ipNumber}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.ipName }]}>
                  <Text>{row.ipName}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.days }, s.tableCellCenter]}>
                  <Text>{row.daysPaid}</Text>
                </View>
                <View style={[s.tableCell, { width: COL_WIDTHS.wage }, s.textRight]}>
                  <Text>{Math.round(row.totalMonthlyWage)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
