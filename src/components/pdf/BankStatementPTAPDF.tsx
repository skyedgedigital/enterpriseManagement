import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatMoneyWhole } from "@/lib/moneyRounding";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BankStatementPTARow {
  serialNo: number;
  workManNo: string;
  name: string;
  bankAccount: string;
  ifsc: string;
  netAmount: number;
}

export interface BankStatementPTAData {
  month: number;
  year: number;
  totalAmount: number;
  rows: BankStatementPTARow[];
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const BORDER = "0.5pt solid #000";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 36,
    color: "#1a1a1a",
    lineHeight: 1.5,
  },
  letterBlock: {
    marginBottom: 0,
  },
  letterRecipient: {
    marginBottom: 14,
  },
  letterRecipientLine: {
    marginBottom: 3,
    fontSize: 11,
  },
  letterDateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  letterSubjectCenter: {
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  letterSubject: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    textDecoration: "underline",
  },
  letterDate: {
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  letterSalutation: {
    marginBottom: 16,
    fontSize: 11,
  },
  letterBody: {
    marginBottom: 14,
    paddingLeft: 0,
    fontSize: 11,
    lineHeight: 1.6,
  },
  letterBodyHighlight: {
    fontFamily: "Helvetica-Bold",
  },
  statementFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  statementFooterText: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  letterTableSection: {
    marginTop: 12,
  },

  // Table page
  tablePage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 20,
    color: "#000",
  },
  table: { width: "100%", marginTop: 0, borderLeft: BORDER, borderTop: BORDER },
  tableRow: { flexDirection: "row" },
  tableHeaderRow: {
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
  },
  cellSlNo: { width: "8%", borderRight: BORDER, borderBottom: BORDER, padding: 4, textAlign: "center" },
  cellWM: { width: "12%", borderRight: BORDER, borderBottom: BORDER, padding: 4, textAlign: "center" },
  cellName: { width: "28%", borderRight: BORDER, borderBottom: BORDER, padding: 4 },
  cellAccount: { width: "22%", borderRight: BORDER, borderBottom: BORDER, padding: 4 },
  cellIfsc: { width: "15%", borderRight: BORDER, borderBottom: BORDER, padding: 4 },
  cellAmount: { width: "15%", borderRight: BORDER, borderBottom: BORDER, padding: 4, textAlign: "right" },
  tableBodyRow: { flexDirection: "row" },
  bodyCellSlNo: { width: "8%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8, textAlign: "center" },
  bodyCellWM: { width: "12%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8, textAlign: "center" },
  bodyCellName: { width: "28%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8 },
  bodyCellAccount: { width: "22%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8 },
  bodyCellIfsc: { width: "15%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8 },
  bodyCellAmount: { width: "15%", borderRight: BORDER, borderBottom: BORDER, padding: 4, fontSize: 8, textAlign: "right" },
});

/** Format amount as whole rupees (nearest integer). */
function formatAmount(amount: number): string {
  return formatMoneyWhole(amount ?? 0);
}

/* ------------------------------------------------------------------ */
/*  Letter (Page 1)                                                    */
/* ------------------------------------------------------------------ */

function PTALetterPage({
  data,
  rows,
}: {
  data: BankStatementPTAData;
  rows: BankStatementPTARow[];
}) {
  const { month, year, totalAmount } = data;
  const monthYearShort = `${MONTH_LABELS[month] ?? month}-${year}`;

  return (
    <Page size="A4" style={s.page}>
      <View style={s.letterBlock}>
        <View style={s.letterRecipient}>
          <Text style={s.letterRecipientLine}>To, </Text>
          <Text style={s.letterRecipientLine}>The Branch Manager</Text>
        </View>

        <View style={s.letterDateRow}>
          <Text style={s.letterDate}>{monthYearShort}</Text>
        </View>
        <Text style={s.letterSubjectCenter}>
          <Text style={s.letterSubject}>Subject: Fund Transfer for Bank Payment</Text>
        </Text>

        <Text style={s.letterSalutation}>Respected Sir,</Text>

        <Text style={s.letterBody}>
          This is to bring to your kind attention that I issued a self cheque of Rs.{" "}
          <Text style={s.letterBodyHighlight}>{totalAmount.toLocaleString("en-IN")}</Text>
          {" "}vide Cheque No.{" "}
        </Text>

        <Text style={s.letterBody}>
          I wish to transfer this amount to the following accounts. Details of which are given below:
        </Text>
      </View>

      <View style={s.statementFooter}>
        <Text style={s.statementFooterText}>Bank Statement for</Text>
      </View>
      <View style={[s.statementFooter, { marginTop: 4 }]}>
        <Text style={s.statementFooterText}>{monthYearShort}</Text>
      </View>

      <View style={s.letterTableSection}>
        <StatementTable rows={rows} />
      </View>
    </Page>
  );
}

const MONTH_LABELS: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

/* ------------------------------------------------------------------ */
/*  Table (Page 2+) with repeated header                               */
/* ------------------------------------------------------------------ */

const FIRST_PAGE_ROWS = 16;
const ROWS_PER_PAGE = 30;

function StatementTable({ rows }: { rows: BankStatementPTARow[] }) {
  return (
    <View style={s.table}>
      <View style={s.tableHeaderRow}>
        <Text style={s.cellSlNo}>Sl. No.</Text>
        <Text style={s.cellWM}>W. M. Sl. No.</Text>
        <Text style={s.cellName}>Name of Workman</Text>
        <Text style={s.cellAccount}>Bank A/c</Text>
        <Text style={s.cellIfsc}>IFSC Code</Text>
        <Text style={s.cellAmount}>Net Amount</Text>
      </View>
      {rows.map((row) => (
        <View key={row.serialNo} style={s.tableBodyRow} wrap={false}>
          <Text style={s.bodyCellSlNo}>{row.serialNo}</Text>
          <Text style={s.bodyCellWM}>{row.workManNo}</Text>
          <Text style={s.bodyCellName}>{row.name}</Text>
          <Text style={s.bodyCellAccount}>{row.bankAccount}</Text>
          <Text style={s.bodyCellIfsc}>{row.ifsc}</Text>
          <Text style={s.bodyCellAmount}>{formatAmount(row.netAmount)}</Text>
        </View>
      ))}
    </View>
  );
}

function TablePage({ rows, pageIndex }: { rows: BankStatementPTARow[]; pageIndex: number }) {
  const start = pageIndex * ROWS_PER_PAGE;
  const pageRows = rows.slice(start, start + ROWS_PER_PAGE);

  return (
    <Page size="A4" style={s.tablePage}>
      <StatementTable rows={pageRows} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/*  Document                                                           */
/* ------------------------------------------------------------------ */

interface Props {
  data: BankStatementPTAData;
}

export function BankStatementPTAPDF({ data }: Props) {
  const { rows } = data;
  const firstPageRows = rows.slice(0, FIRST_PAGE_ROWS);
  const remainingRows = rows.slice(FIRST_PAGE_ROWS);
  const tablePageCount = Math.ceil(remainingRows.length / ROWS_PER_PAGE);

  return (
    <Document>
      <PTALetterPage data={data} rows={firstPageRows} />
      {Array.from({ length: tablePageCount }, (_, i) => (
        <TablePage key={i} rows={remainingRows} pageIndex={i} />
      ))}
    </Document>
  );
}
