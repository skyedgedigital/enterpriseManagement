import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BonusChecklistData } from "@/lib/buildBonusChecklistData";
import {
  computeBonusChecklistFooterTotals,
  financialYearMonthSequence,
} from "@/lib/buildBonusChecklistData";

const ROWS_PER_PAGE = 10;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 5.2,
    color: "#000",
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  headerBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 8,
    marginBottom: 10,
    fontFamily: "Times-Roman",
    fontSize: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    width: "34%",
    paddingRight: 4,
  },
  headerCenter: {
    width: "32%",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  dateRowsBlock: {
    width: "100%",
    maxWidth: 200,
    alignSelf: "center",
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 2,
    width: "100%",
  },
  dateLabel: {
    width: 58,
    fontSize: 8,
    textAlign: "left",
  },
  dateValue: {
    flexGrow: 1,
    fontSize: 8,
    textAlign: "right",
  },
  headerRight: {
    width: "34%",
    alignItems: "flex-end",
    paddingLeft: 4,
  },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  addressLine: {
    fontSize: 7.5,
    marginBottom: 1,
  },
  docTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    textAlign: "center",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  pageLine: {
    fontSize: 8,
    textAlign: "right",
    marginBottom: 6,
  },
  orderLine: {
    fontSize: 8,
    textAlign: "right",
  },
  table: { borderWidth: 0.5, borderColor: "#000", marginTop: 10 },
  row: { flexDirection: "row", borderBottomWidth: 0.25, borderColor: "#000" },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 0.5,
    borderColor: "#000",
    backgroundColor: "#e8e8e8",
    fontFamily: "Helvetica-Bold",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
  },
  cell: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    borderRightWidth: 0.25,
    borderColor: "#000",
    justifyContent: "center",
  },
  /** Extra room in month columns between days line and amount line */
  cellMonth: {
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  cellRight: { textAlign: "right" },
  cellCenter: { textAlign: "center" },
  /** Month & stacked figures: numbers share one right edge */
  cellNumericStack: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  monthText: {
    textAlign: "right",
    width: "100%",
  },
  monthLineDays: {
    textAlign: "right",
    width: "100%",
    marginBottom: 5,
  },
  monthLineAmount: {
    textAlign: "right",
    width: "100%",
  },
  colSl: { width: "2.2%" },
  colWn: { width: "2.8%" },
  colName: { width: "7.5%" },
  colMo: { width: "5.35%" },
  colAr: { width: "3.8%" },
  colTot: { width: "4.2%" },
  colPr: { width: "3.5%" },
  colDy: { width: "3%" },
  /** Separator between “total days” row and monthly amount summary */
  monthlySummaryDivider: {
    borderTopWidth: 1,
    borderColor: "#000",
    marginTop: 12,
    paddingTop: 14,
    paddingBottom: 6,
  },
  summaryFlowRow: {
    flexDirection: "row",
    marginBottom: 9,
    width: "100%",
  },
  summaryPair: {
    width: "20%",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingRight: 10,
    paddingLeft: 8,
    paddingVertical: 2,
  },
  summaryMonthLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    marginRight: 12,
    minWidth: 28,
  },
  summaryMonthAmount: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    flexGrow: 1,
  },
  summaryGrandRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderColor: "#000",
    width: "100%",
  },
  summaryGrandPair: {
    width: "42%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 18,
    paddingVertical: 4,
  },
  summaryGrandLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginRight: 14,
  },
  summaryGrandAmount: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
});

function fmtDays(n: number): string {
  if (n === 0) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Thousands separators like 500,080.00 (matches common Indian CSV/PDF style). */
function fmtAmountGrouped(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function chunkBy<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function chunkPages<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out.length ? out : [[]];
}

export interface BonusChecklistPDFProps {
  data: BonusChecklistData;
  documentTitle: string;
}

export function BonusChecklistPDF({ data, documentTitle }: BonusChecklistPDFProps) {
  const pages = chunkPages(data.rows, ROWS_PER_PAGE);
  const totalPages = Math.max(1, pages.length);
  const monthLabels =
    data.rows[0]?.months.map((m) => m.label) ??
    financialYearMonthSequence(data.fyEndYear).map((m) => m.label);

  const orderDisplay = data.orderNumber.trim() === "" ? "" : data.orderNumber;
  const footer = computeBonusChecklistFooterTotals(data.rows);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" orientation="landscape" style={s.page}>
          <View style={s.headerBox}>
            <View style={s.headerRow}>
              <View style={s.headerLeft}>
                <Text style={s.companyName}>{data.contractorName}</Text>
                <Text style={s.addressLine}>{data.contractorOfficeLine}</Text>
                <Text style={s.addressLine}>{data.contractorCorrespondingLine}</Text>
              </View>
              <View style={s.headerCenter}>
                <Text style={s.docTitle}>{documentTitle}</Text>
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
              </View>
              <View style={s.headerRight}>
                <Text style={s.pageLine}>
                  Page {pi + 1} of {totalPages}
                </Text>
                <Text style={s.orderLine}>
                  Order Number    {orderDisplay}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.table}>
            <View style={s.tableHeaderRow}>
              <View style={[s.cell, s.colSl, s.cellCenter]}>
                <Text>Sl</Text>
              </View>
              <View style={[s.cell, s.colWn, s.cellCenter]}>
                <Text>W.No</Text>
              </View>
              <View style={[s.cell, s.colName]}>
                <Text>Name</Text>
              </View>
              {monthLabels.map((lab) => (
                <View key={lab} style={[s.cell, s.colMo, s.cellNumericStack, s.cellMonth]}>
                  <Text style={s.monthText}>{lab}</Text>
                </View>
              ))}
              <View style={[s.cell, s.colAr, s.cellNumericStack]}>
                <Text style={s.monthText}>Arrear</Text>
              </View>
              <View style={[s.cell, s.colTot, s.cellNumericStack]}>
                <Text style={s.monthText}>Total</Text>
              </View>
              <View style={[s.cell, s.colPr, s.cellNumericStack]}>
                <Text style={s.monthText}>PayRate</Text>
              </View>
              <View style={[s.cell, s.colDy, s.cellNumericStack]}>
                <Text style={s.monthText}>Days</Text>
              </View>
            </View>

            {pageRows.map((row, ri) => {
              const sl = pi * ROWS_PER_PAGE + ri + 1;
              return (
                <View key={row.employeeId} style={s.row} wrap={false}>
                  <View style={[s.cell, s.colSl, s.cellCenter]}>
                    <Text>{sl}</Text>
                  </View>
                  <View style={[s.cell, s.colWn, s.cellCenter]}>
                    <Text>{row.workManNo}</Text>
                  </View>
                  <View style={[s.cell, s.colName]}>
                    <Text>{row.employeeName}</Text>
                  </View>
                  {row.months.map((m) => (
                    <View
                      key={`${m.year}-${m.month}`}
                      style={[s.cell, s.colMo, s.cellNumericStack, s.cellMonth]}
                    >
                      <Text style={s.monthLineDays}>{fmtDays(m.days)}</Text>
                      <Text style={s.monthLineAmount}>{fmtAmountGrouped(m.amount)}</Text>
                    </View>
                  ))}
                  <View style={[s.cell, s.colAr, s.cellNumericStack]}>
                    <Text style={s.monthText}>{fmtAmountGrouped(row.arrear)}</Text>
                  </View>
                  <View style={[s.cell, s.colTot, s.cellNumericStack]}>
                    <Text style={s.monthText}>{fmtAmountGrouped(row.total)}</Text>
                  </View>
                  <View style={[s.cell, s.colPr, s.cellNumericStack]}>
                    <Text style={s.monthText}>{fmtAmountGrouped(row.payRate)}</Text>
                  </View>
                  <View style={[s.cell, s.colDy, s.cellNumericStack]}>
                    <Text style={s.monthText}>{fmtDays(row.daysWorkedYear)}</Text>
                  </View>
                </View>
              );
            })}

            {pi === pages.length - 1 ? (
              <View style={s.totalsRow} wrap={false}>
                <View style={[s.cell, s.colSl, s.cellCenter]}>
                  <Text> </Text>
                </View>
                <View style={[s.cell, s.colWn, s.cellCenter]}>
                  <Text> </Text>
                </View>
                <View style={[s.cell, s.colName]}>
                  <Text>Total</Text>
                </View>
                {monthLabels.map((_, mi) => {
                  const t = footer.perMonth[mi] ?? { days: 0, amount: 0 };
                  return (
                    <View key={`ft-d-${mi}`} style={[s.cell, s.colMo, s.cellNumericStack, s.cellMonth]}>
                      <Text style={s.monthText}>{fmtDays(t.days)}</Text>
                    </View>
                  );
                })}
                <View style={[s.cell, s.colAr, s.cellNumericStack]}>
                  <Text style={s.monthText}> </Text>
                </View>
                <View style={[s.cell, s.colTot, s.cellNumericStack]}>
                  <Text style={s.monthText}> </Text>
                </View>
                <View style={[s.cell, s.colPr, s.cellNumericStack]}>
                  <Text style={s.monthText}> </Text>
                </View>
                <View style={[s.cell, s.colDy, s.cellNumericStack]}>
                  <Text style={s.monthText}>{fmtDays(footer.sumDaysWorkedYear)}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {pi === pages.length - 1 ? (
            <View style={s.monthlySummaryDivider} wrap={false}>
              {chunkBy(
                monthLabels.map((label, mi) => ({
                  label,
                  amount: footer.perMonth[mi]?.amount ?? 0,
                })),
                5,
              ).map((group, ri) => (
                <View key={`sum-row-${ri}`} style={s.summaryFlowRow}>
                  {group.map((p) => (
                    <View key={p.label} style={s.summaryPair}>
                      <Text style={s.summaryMonthLabel}>{p.label}</Text>
                      <Text style={s.summaryMonthAmount}>{fmtAmountGrouped(p.amount)}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <View style={s.summaryGrandRow}>
                <View style={s.summaryGrandPair}>
                  <Text style={s.summaryGrandLabel}>Arrear</Text>
                  <Text style={s.summaryGrandAmount}>{fmtAmountGrouped(footer.sumArrear)}</Text>
                </View>
                <View style={s.summaryGrandPair}>
                  <Text style={s.summaryGrandLabel}>Total</Text>
                  <Text style={s.summaryGrandAmount}>
                    {fmtAmountGrouped(footer.sumPaidExcludingArrear)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}
        </Page>
      ))}
    </Document>
  );
}
