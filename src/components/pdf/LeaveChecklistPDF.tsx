import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { LeaveRegisterChecklistData } from "@/lib/buildLeaveRegisterChecklistData";
import {
  calendarYearMonthSequence,
  computeLeaveRegisterFooterTotals,
} from "@/lib/buildLeaveRegisterChecklistData";

const ROWS_PER_PAGE = 10;

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 5.5,
    color: "#000",
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  headerBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 6,
    marginBottom: 8,
    fontFamily: "Times-Roman",
    fontSize: 7,
  },
  headerMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { width: "32%", paddingRight: 3 },
  headerCenter: { width: "34%", alignItems: "center", paddingHorizontal: 3 },
  headerRight: { width: "34%", alignItems: "flex-end", paddingLeft: 3 },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 8.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  addressLine: { fontSize: 7, marginBottom: 1 },
  docTitle: {
    fontFamily: "Times-Bold",
    fontSize: 10,
    textAlign: "center",
    textDecoration: "underline",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  subTitle: { fontSize: 7.5, textAlign: "center", marginBottom: 2 },
  rightLabel: { fontSize: 6.5, textAlign: "right", marginBottom: 1 },
  rightValue: { fontSize: 7, textAlign: "right", marginBottom: 3, fontFamily: "Times-Bold" },
  pageLine: { fontSize: 7.5, textAlign: "right", marginBottom: 4 },
  natureRow: {
    flexDirection: "row",
    marginTop: 4,
    paddingTop: 3,
    borderTopWidth: 0.25,
    borderColor: "#ccc",
    width: "100%",
  },
  natureLabel: { fontSize: 6.5, fontFamily: "Times-Bold", marginRight: 4 },
  natureValue: { fontSize: 6.5, flexGrow: 1 },
  table: { borderWidth: 0.5, borderColor: "#000", marginTop: 4, width: "100%" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.25,
    borderColor: "#000",
    width: "100%",
    alignItems: "stretch",
  },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 0.5,
    borderColor: "#000",
    backgroundColor: "#e8e8e8",
    fontFamily: "Helvetica-Bold",
    width: "100%",
    alignItems: "stretch",
  },
  thCell: {
    paddingVertical: 2,
    paddingHorizontal: 1,
    borderRightWidth: 0.25,
    borderColor: "#000",
    borderBottomWidth: 0.25,
    justifyContent: "center",
    backgroundColor: "#e8e8e8",
    fontFamily: "Helvetica-Bold",
  },
  thCellTop: { minHeight: 22, justifyContent: "center" },
  cell: {
    paddingVertical: 2,
    paddingHorizontal: 1,
    borderRightWidth: 0.25,
    borderColor: "#000",
    justifyContent: "center",
  },
  cellRight: { textAlign: "right" },
  cellCenter: { textAlign: "center" },
  colSl: { width: "1.8%" },
  colName: { width: "4.8%" },
  colFather: { width: "4.8%" },
  colSex: { width: "1.9%" },
  colMo: { width: "3.05%" },
  colTAtt: { width: "2.6%" },
  colLv: { width: "2.35%" },
  /** Fills remaining row width so no empty strip appears after Remarks */
  colRm: { flexGrow: 1, flexShrink: 1, minWidth: "12%" },
  totalLeaveBanner: {
    width: "9.4%",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 0.25,
    borderBottomWidth: 0.25,
    borderColor: "#000",
    backgroundColor: "#e8e8e8",
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
  },
});

function fmtDays(n: number): string {
  if (n === 0) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function chunkPages<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out.length ? out : [[]];
}

export interface LeaveChecklistPDFProps {
  data: LeaveRegisterChecklistData;
}

function TableHeaderRows({ monthLabels }: { monthLabels: string[] }) {
  return (
    <>
      <View style={s.row} wrap={false}>
        <View style={[s.thCell, s.colSl, s.thCellTop, s.cellCenter]}>
          <Text>Sl.N</Text>
        </View>
        <View style={[s.thCell, s.colName, s.thCellTop]}>
          <Text>Name of Worker</Text>
        </View>
        <View style={[s.thCell, s.colFather, s.thCellTop]}>
          <Text>Father&apos;s Name</Text>
        </View>
        <View style={[s.thCell, s.colSex, s.thCellTop, s.cellCenter]}>
          <Text>Sex</Text>
        </View>
        {monthLabels.map((lab) => (
          <View key={`h1-${lab}`} style={[s.thCell, s.colMo, s.thCellTop, s.cellRight]}>
            <Text>{lab}</Text>
          </View>
        ))}
        <View style={[s.thCell, s.colTAtt, s.thCellTop, s.cellRight]}>
          <Text>Total Attn.</Text>
        </View>
        <View style={s.totalLeaveBanner}>
          <Text>TOTAL LEAVE</Text>
        </View>
        <View style={[s.thCell, s.colRm, s.thCellTop, { borderRightWidth: 0 }]}>
          <Text>Remarks</Text>
        </View>
      </View>
      <View style={s.row} wrap={false}>
        <View style={[s.thCell, s.colSl, s.cellCenter]}>
          <Text> </Text>
        </View>
        <View style={[s.thCell, s.colName]}>
          <Text> </Text>
        </View>
        <View style={[s.thCell, s.colFather]}>
          <Text> </Text>
        </View>
        <View style={[s.thCell, s.colSex, s.cellCenter]}>
          <Text> </Text>
        </View>
        {monthLabels.map((lab) => (
          <View key={`h2-${lab}`} style={[s.thCell, s.colMo, s.cellRight]}>
            <Text> </Text>
          </View>
        ))}
        <View style={[s.thCell, s.colTAtt, s.cellRight]}>
          <Text> </Text>
        </View>
        <View style={[s.thCell, s.colLv, s.cellRight]}>
          <Text>EL</Text>
        </View>
        <View style={[s.thCell, s.colLv, s.cellRight]}>
          <Text>CL</Text>
        </View>
        <View style={[s.thCell, s.colLv, s.cellRight]}>
          <Text>FL</Text>
        </View>
        <View style={[s.thCell, s.colLv, s.cellRight]}>
          <Text>Total</Text>
        </View>
        <View style={[s.thCell, s.colRm, { borderRightWidth: 0 }]}>
          <Text> </Text>
        </View>
      </View>
    </>
  );
}

export function LeaveChecklistPDF({ data }: LeaveChecklistPDFProps) {
  const pages = chunkPages(data.rows, ROWS_PER_PAGE);
  const totalPages = Math.max(1, pages.length);
  const monthLabels =
    data.rows[0]?.months.map((m) => m.label) ??
    calendarYearMonthSequence(data.calendarYear).map((m) => m.label);
  const orderDisplay = data.orderNumber.trim() === "" ? "" : data.orderNumber;
  const footer = computeLeaveRegisterFooterTotals(data.rows);

  return (
    <Document>
      {pages.map((pageRows, pi) => (
        <Page key={pi} size="A4" orientation="landscape" style={s.page}>
          <View style={s.headerBox}>
            <View style={s.headerMainRow}>
              <View style={s.headerLeft}>
                <Text style={s.companyName}>{data.companyName}</Text>
                <Text style={s.addressLine}>{data.officeLine}</Text>
                <Text style={s.addressLine}>{data.correspondingLine}</Text>
              </View>
              <View style={s.headerCenter}>
                <Text style={s.docTitle}>MUSTER ROLL</Text>
                <Text style={s.subTitle}>
                  Leave Register from {data.periodFromDisplay} To {data.periodToDisplay}
                </Text>
              </View>
              <View style={s.headerRight}>
                <Text style={s.pageLine}>
                  Page {pi + 1} of {totalPages}
                </Text>
                {orderDisplay ? (
                  <Text style={s.rightLabel}>Order / contract ref.: {orderDisplay}</Text>
                ) : null}
                <Text style={s.rightLabel}>Name and Address of the Contractor</Text>
                <Text style={s.rightLabel}>In under which contract is carried on</Text>
                <Text style={s.rightValue}>{data.contractorPartyText}</Text>
                <Text style={s.rightLabel}>Name & Address of the Principal Employer</Text>
                <Text style={s.rightValue}>{data.principalEmployerText}</Text>
              </View>
            </View>
            <View style={s.natureRow}>
              <Text style={s.natureLabel}>Nature & Location of Work</Text>
              <Text style={s.natureValue}>{data.natureLocationOfWork || " "}</Text>
            </View>
          </View>

          <View style={s.table}>
            <TableHeaderRows monthLabels={monthLabels} />

            {pageRows.map((row, ri) => {
              const sl = pi * ROWS_PER_PAGE + ri + 1;
              return (
                <View key={row.employeeId} style={s.row} wrap={false}>
                  <View style={[s.cell, s.colSl, s.cellCenter]}>
                    <Text>{sl}</Text>
                  </View>
                  <View style={[s.cell, s.colName]}>
                    <Text>{row.employeeName}</Text>
                  </View>
                  <View style={[s.cell, s.colFather]}>
                    <Text>{row.fathersName}</Text>
                  </View>
                  <View style={[s.cell, s.colSex, s.cellCenter]}>
                    <Text>{row.sex}</Text>
                  </View>
                  {row.months.map((m) => (
                    <View
                      key={`${row.employeeId}-${m.month}`}
                      style={[s.cell, s.colMo, s.cellRight]}
                    >
                      <Text>{fmtDays(m.presentDays)}</Text>
                    </View>
                  ))}
                  <View style={[s.cell, s.colTAtt, s.cellRight]}>
                    <Text>{fmtDays(row.totalPresent)}</Text>
                  </View>
                  <View style={[s.cell, s.colLv, s.cellRight]}>
                    <Text>{String(row.totalEL)}</Text>
                  </View>
                  <View style={[s.cell, s.colLv, s.cellRight]}>
                    <Text>{String(row.totalCL)}</Text>
                  </View>
                  <View style={[s.cell, s.colLv, s.cellRight]}>
                    <Text>{String(row.totalFL)}</Text>
                  </View>
                  <View style={[s.cell, s.colLv, s.cellRight]}>
                    <Text>{String(row.totalLeave)}</Text>
                  </View>
                  <View style={[s.cell, s.colRm, { borderRightWidth: 0 }]}>
                    <Text>{row.remarks}</Text>
                  </View>
                </View>
              );
            })}

            {pi === pages.length - 1 && data.rows.length > 0 ? (
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
                <View style={[s.cell, s.colSex, s.cellCenter]}>
                  <Text />
                </View>
                {monthLabels.map((_, mi) => (
                  <View key={`ft-${mi}`} style={[s.cell, s.colMo, s.cellRight]}>
                    <Text>{fmtDays(footer.perMonthPresent[mi] ?? 0)}</Text>
                  </View>
                ))}
                <View style={[s.cell, s.colTAtt, s.cellRight]}>
                  <Text>{fmtDays(footer.sumTotalPresent)}</Text>
                </View>
                <View style={[s.cell, s.colLv, s.cellRight]}>
                  <Text>{String(footer.sumEL)}</Text>
                </View>
                <View style={[s.cell, s.colLv, s.cellRight]}>
                  <Text>{String(footer.sumCL)}</Text>
                </View>
                <View style={[s.cell, s.colLv, s.cellRight]}>
                  <Text>{String(footer.sumFL)}</Text>
                </View>
                <View style={[s.cell, s.colLv, s.cellRight]}>
                  <Text>{String(footer.sumTotalLeave)}</Text>
                </View>
                <View style={[s.cell, s.colRm, { borderRightWidth: 0 }]}>
                  <Text />
                </View>
              </View>
            ) : null}
          </View>
        </Page>
      ))}
    </Document>
  );
}
