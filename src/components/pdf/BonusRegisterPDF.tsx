import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BonusRegisterData } from "@/lib/buildBonusRegisterData";
import { computeBonusRegisterFooterTotals } from "@/lib/buildBonusRegisterData";

const ROWS_PER_PAGE = 7;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 4.8,
    color: "#000",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  headerBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
    marginBottom: 6,
    fontFamily: "Times-Roman",
    fontSize: 7,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { width: "32%", paddingRight: 4 },
  headerCenter: { width: "36%", alignItems: "center", paddingHorizontal: 4 },
  headerRight: { width: "32%", alignItems: "flex-end", paddingLeft: 4 },
  formC: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginBottom: 2,
  },
  formLeftLine: { fontSize: 6.5, marginBottom: 2, lineHeight: 1.25 },
  establishmentLabel: { fontSize: 7, marginBottom: 1 },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 8.5,
    marginBottom: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  officeAddLine: { fontSize: 7, marginBottom: 1, textAlign: "center" },
  docTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    textAlign: "right",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  dateRowsBlock: { width: "100%", maxWidth: 200, alignSelf: "flex-end", marginTop: 0 },
  dateRow: { flexDirection: "row", marginBottom: 2, width: "100%" },
  dateLabel: { width: 58, fontSize: 7, textAlign: "left" },
  dateValue: { flexGrow: 1, fontSize: 7, textAlign: "right" },
  orderLine: { fontSize: 7.5, textAlign: "right", marginTop: 2 },
  pageFooter: { fontSize: 6.5, textAlign: "center", marginTop: 4 },
  table: { borderWidth: 0.5, borderColor: "#000", marginTop: 4 },
  row: { flexDirection: "row", borderBottomWidth: 0.25, borderColor: "#000" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
    minHeight: 36,
  },
  tableHeaderRow2: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
    minHeight: 44,
  },
  tableHeaderText: { fontSize: 4.2, lineHeight: 1.15 },
  tableHeaderTextDed: { fontSize: 4, lineHeight: 1.12 },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 0.5,
    borderColor: "#000",
    backgroundColor: "#e8e8e8",
    fontFamily: "Helvetica-Bold",
  },
  cell: {
    paddingVertical: 2,
    paddingHorizontal: 1,
    borderRightWidth: 0.25,
    borderColor: "#000",
    justifyContent: "center",
  },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  colSl: { width: "2.5%" },
  colName: { width: "9%" },
  colFather: { width: "9%" },
  col15: { width: "3.5%" },
  colDesg: { width: "8%" },
  colDays: { width: "4%" },
  colAmt: { width: "8%" },
  colDed: { width: "5%" },
  colTotDed: { width: "5%" },
  colNet: { width: "8%" },
  colPaid: { width: "6%" },
  colDate: { width: "6%" },
  colSign: { width: "7%" },
  dedGroup: { width: "15%" },
});

function fmtDays(n: number): string {
  if (n === 0) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function fmtAmountGrouped(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtAmount2(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function chunkPages<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out.length ? out : [[]];
}

export interface BonusRegisterPDFProps {
  data: BonusRegisterData;
}

export function BonusRegisterPDF({ data }: BonusRegisterPDFProps) {
  const pages = chunkPages(data.rows, ROWS_PER_PAGE);
  const totalPages = Math.max(1, pages.length);
  const orderDisplay = data.orderNumber.trim() === "" ? "" : data.orderNumber;
  const footer = computeBonusRegisterFooterTotals(data.rows);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" orientation="landscape" style={s.page}>
          <View style={s.headerBox}>
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                <Text style={s.formC}>FORM C</Text>
                <Text style={s.formLeftLine}>
                  Under Rule 4(d) of the Payment of Bonus Rules, 1965
                </Text>
                <Text style={s.formLeftLine}>
                  {`Bonus Paid to Employees for the Accounting Year ending on the ${data.periodToDisplay}`}
                </Text>
              </View>
              <View style={s.headerCenter}>
                <Text style={s.establishmentLabel}>Name of Establishment</Text>
                <Text style={s.companyName}>{data.contractorName}</Text>
                <Text style={s.officeAddLine}>
                  {`Office Add.-${data.contractorOfficeLine}`}
                </Text>
              </View>
              <View style={s.headerRight}>
                <Text style={s.docTitle}>BONUS REGISTER</Text>
                <View style={s.dateRowsBlock}>
                  <View style={s.dateRow}>
                    <Text style={s.dateLabel}>From Date</Text>
                    <Text style={s.dateValue}>{data.periodFromDisplay}</Text>
                  </View>
                  <View style={s.dateRow}>
                    <Text style={s.dateLabel}>To Date</Text>
                    <Text style={s.dateValue}>{data.periodToDisplay}</Text>
                  </View>
                </View>
                <Text style={s.orderLine}>
                  {orderDisplay ? `Order No.: ${orderDisplay}` : "Order No.:"}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <View style={[s.cell, s.colSl, s.cellCenter]}>
                <Text style={s.tableHeaderText}>Sl. No.</Text>
              </View>
              <View style={[s.cell, s.colName]}>
                <Text style={s.tableHeaderText}>Employee Name</Text>
              </View>
              <View style={[s.cell, s.colFather]}>
                <Text style={s.tableHeaderText}>Father&apos;s Name</Text>
              </View>
              <View style={[s.cell, s.col15, s.cellCenter]}>
                <Text style={s.tableHeaderText}>
                  Whether he has completed 15 of Age at the beginning of the Accounting Year
                </Text>
              </View>
              <View style={[s.cell, s.colDesg]}>
                <Text style={s.tableHeaderText}>Desig</Text>
              </View>
              <View style={[s.cell, s.colDays, s.cellCenter]}>
                <Text style={s.tableHeaderText}>No. of Days Worked in the Year</Text>
              </View>
              <View style={[s.cell, s.colAmt, s.cellRight]}>
                <Text style={s.tableHeaderText}>
                  Total Salary or Wages in Respect of the Acc. Year
                </Text>
              </View>
              <View style={[s.cell, s.colAmt, s.cellRight]}>
                <Text style={s.tableHeaderText}>
                  Amount of Bonus Payable under Sec 10 & Sec. 11 as the case may be
                </Text>
              </View>
              <View style={[s.cell, s.dedGroup, s.cellCenter]}>
                <Text style={s.tableHeaderText}>DEDUCTION</Text>
              </View>
              <View style={[s.cell, s.colTotDed, s.cellRight]}>
                <Text style={s.tableHeaderText}>
                  Total Sum Deducted Col. 9, 10, 11
                </Text>
              </View>
              <View style={[s.cell, s.colNet, s.cellRight]}>
                <Text style={s.tableHeaderText}>
                  Net Payable Amount Col 8 minus Col 10
                </Text>
              </View>
              <View style={[s.cell, s.colPaid, s.cellRight]}>
                <Text style={s.tableHeaderText}>Amount Actually Paid</Text>
              </View>
              <View style={[s.cell, s.colDate, s.cellCenter]}>
                <Text style={s.tableHeaderText}>Date on which paid</Text>
              </View>
              <View style={[s.cell, s.colSign, s.cellCenter, { borderRightWidth: 0 }]}>
                <Text style={s.tableHeaderText}>
                  Signature or Thumb Impression of the Employee
                </Text>
              </View>
            </View>

            <View style={s.tableHeaderRow2}>
              <View style={[s.cell, s.colSl, s.cellCenter]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colName]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colFather]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.col15]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colDesg]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colDays]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colAmt]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colAmt]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colDed, s.cellRight]}>
                <Text style={s.tableHeaderTextDed}>
                  Puja Bonus or Other Customary Bonus paid during the Acc. Year
                </Text>
              </View>
              <View style={[s.cell, s.colDed, s.cellRight]}>
                <Text style={s.tableHeaderTextDed}>
                  Interim Bonus Bonus Paid in Advance
                </Text>
              </View>
              <View style={[s.cell, s.colDed, s.cellRight]}>
                <Text style={s.tableHeaderTextDed}>
                  Deduction on A/c of Financial Loss if any Caused by Misconduct of the Emp.
                </Text>
              </View>
              <View style={[s.cell, s.colTotDed]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colNet]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colPaid]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colDate]}>
                <Text> </Text>
              </View>
              <View style={[s.cell, s.colSign, { borderRightWidth: 0 }]}>
                <Text> </Text>
              </View>
            </View>

            {pageRows.map((row) => (
              <View key={row.employeeId} style={s.row} wrap={false}>
                <View style={[s.cell, s.colSl, s.cellCenter]}>
                  <Text>{row.slNo}</Text>
                </View>
                <View style={[s.cell, s.colName]}>
                  <Text>{row.employeeName}</Text>
                </View>
                <View style={[s.cell, s.colFather]}>
                  <Text>{row.fathersName}</Text>
                </View>
                <View style={[s.cell, s.col15, s.cellCenter]}>
                  <Text>{row.completed15YearsAtFyStart}</Text>
                </View>
                <View style={[s.cell, s.colDesg]}>
                  <Text>{row.designation}</Text>
                </View>
                <View style={[s.cell, s.colDays, s.cellCenter]}>
                  <Text>{fmtDays(row.daysWorkedYear)}</Text>
                </View>
                <View style={[s.cell, s.colAmt, s.cellRight]}>
                  <Text>{fmtAmountGrouped(row.totalSalaryOrWages)}</Text>
                </View>
                <View style={[s.cell, s.colAmt, s.cellRight]}>
                  <Text>{fmtAmount2(row.amountOfBonusPayable)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(row.deductionPujaOrCustomary)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(row.deductionInterimBonus)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(row.deductionFinancialLoss)}</Text>
                </View>
                <View style={[s.cell, s.colTotDed, s.cellRight]}>
                  <Text>{fmtAmount2(row.totalSumDeducted)}</Text>
                </View>
                <View style={[s.cell, s.colNet, s.cellRight]}>
                  <Text>{fmtAmount2(row.netPayableAmount)}</Text>
                </View>
                <View style={[s.cell, s.colPaid, s.cellRight]}>
                  <Text>{fmtAmount2(row.netPayableAmount)}</Text>
                </View>
                <View style={[s.cell, s.colDate, s.cellCenter]}>
                  <Text> </Text>
                </View>
                <View style={[s.cell, s.colSign, s.cellCenter, { borderRightWidth: 0 }]}>
                  <Text> </Text>
                </View>
              </View>
            ))}

            {pi === pages.length - 1 ? (
              <View style={s.totalsRow} wrap={false}>
                <View style={[s.cell, s.colSl, s.cellCenter]}>
                  <Text />
                </View>
                <View style={[s.cell, s.colName]}>
                  <Text>Total</Text>
                </View>
                <View style={[s.cell, s.colFather]}>
                  <Text />
                </View>
                <View style={[s.cell, s.col15]}>
                  <Text />
                </View>
                <View style={[s.cell, s.colDesg]}>
                  <Text />
                </View>
                <View style={[s.cell, s.colDays, s.cellCenter]}>
                  <Text>{fmtDays(footer.sumDaysWorkedYear)}</Text>
                </View>
                <View style={[s.cell, s.colAmt, s.cellRight]}>
                  <Text>{fmtAmountGrouped(footer.sumTotalSalaryOrWages)}</Text>
                </View>
                <View style={[s.cell, s.colAmt, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumBonusPayable)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumDeductionPujaOrCustomary)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumDeductionInterimBonus)}</Text>
                </View>
                <View style={[s.cell, s.colDed, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumDeductionFinancialLoss)}</Text>
                </View>
                <View style={[s.cell, s.colTotDed, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumTotalDeducted)}</Text>
                </View>
                <View style={[s.cell, s.colNet, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumNetPayable)}</Text>
                </View>
                <View style={[s.cell, s.colPaid, s.cellRight]}>
                  <Text>{fmtAmount2(footer.sumNetPayable)}</Text>
                </View>
                <View style={[s.cell, s.colDate]}>
                  <Text />
                </View>
                <View style={[s.cell, s.colSign, { borderRightWidth: 0 }]}>
                  <Text />
                </View>
              </View>
            ) : null}
          </View>

          <Text style={s.pageFooter}>
            Page {pi + 1} of {totalPages}
          </Text>
        </Page>
      ))}
    </Document>
  );
}
