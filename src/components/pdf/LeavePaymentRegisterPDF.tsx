import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { LeavePaymentRegisterData, LeavePaymentRegisterRow } from "@/lib/buildLeavePaymentRegisterData";
import { formatMoney2, formatMoneyWhole } from "@/lib/moneyRounding";

const ROWS_PER_PAGE = 8;

/** 19 physical columns: 01–07, 08–11 wages, 12 total, 13×3 deductions, 14 net, 15–16 sign, 17 remarks */
const RAW_WIDTHS = [
  2.2, 8, 3.2, 5.2, 4.8, 2, 4.5, 3.8, 3.8, 3.5, 3.8, 4, 2.6, 2.6, 2.6, 4.2, 3, 3, 7.5,
];
const W_SUM = RAW_WIDTHS.reduce((a, b) => a + b, 0);

function w(i: number): `${string}%` {
  return `${((RAW_WIDTHS[i]! / W_SUM) * 100).toFixed(2)}%` as `${string}%`;
}

function wRange(start: number, count: number): `${string}%` {
  const sum = RAW_WIDTHS.slice(start, start + count).reduce((a, b) => a + b, 0);
  return `${((sum / W_SUM) * 100).toFixed(2)}%` as `${string}%`;
}

function chunkRows<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length > 0 ? pages : [[]];
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 4.6,
    color: "#000",
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 6,
    flexDirection: "column",
  },
  pageBody: {
    flexGrow: 1,
    flexDirection: "column",
  },
  headerBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
    marginBottom: 4,
    fontFamily: "Times-Roman",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { width: "33%", paddingRight: 3 },
  headerCenter: { width: "34%", alignItems: "center", paddingHorizontal: 2 },
  headerRight: { width: "33%", alignItems: "flex-end", paddingLeft: 3 },
  contractorLabel: { fontSize: 5.8, marginBottom: 1, fontFamily: "Times-Bold" },
  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 7.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  addressLine: { fontSize: 6.2, marginBottom: 1 },
  formTitleMain: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 2,
  },
  formRef: { fontSize: 6.2, textAlign: "center", marginBottom: 1 },
  formTitleSub: {
    fontFamily: "Times-Bold",
    fontSize: 8,
    textAlign: "center",
    textDecoration: "underline",
    marginBottom: 2,
  },
  periodLine: { fontSize: 6.8, textAlign: "center", marginBottom: 2 },
  rightLabel: { fontSize: 5.8, textAlign: "right", marginBottom: 1 },
  rightValue: { fontSize: 6.2, textAlign: "right", fontFamily: "Times-Bold", marginBottom: 3 },
  natureRow: {
    flexDirection: "row",
    marginTop: 3,
    paddingTop: 2,
    borderTopWidth: 0.5,
    borderColor: "#000",
    width: "100%",
  },
  natureLabel: { fontSize: 6, fontFamily: "Times-Bold", marginRight: 3 },
  natureValue: { fontSize: 6, flexGrow: 1 },
  woRow: { flexDirection: "row", marginTop: 2, width: "100%" },
  table: {
    borderWidth: 0.5,
    borderColor: "#000",
    marginTop: 2,
    width: "100%",
  },
  thRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    fontFamily: "Helvetica-Bold",
    alignItems: "stretch",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.25,
    borderColor: "#000",
    alignItems: "stretch",
  },
  cell: {
    paddingVertical: 1,
    paddingHorizontal: 1,
    borderRightWidth: 0.25,
    borderColor: "#000",
    justifyContent: "center",
  },
  thCell: {
    paddingVertical: 2,
    paddingHorizontal: 1,
    borderRightWidth: 0.25,
    borderColor: "#000",
    justifyContent: "center",
    fontSize: 4.3,
    fontFamily: "Helvetica-Bold",
  },
  cellCenter: { textAlign: "center" },
  cellRight: { textAlign: "right" },
  mergeTh: {
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 0.25,
    borderColor: "#000",
    paddingVertical: 2,
    paddingHorizontal: 1,
    backgroundColor: "#e8e8e8",
  },
  footerWrap: {
    marginTop: 5,
    paddingTop: 3,
    borderTopWidth: 0.5,
    borderColor: "#000",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerLeft: { width: "22%", fontSize: 6.5, fontFamily: "Times-Roman" },
  footerRight: { width: "74%", fontSize: 6.5, fontFamily: "Times-Roman" },
  footerCert: { lineHeight: 1.4, textAlign: "left" },
  footerSignLine: { marginTop: 10, fontSize: 6.5, textAlign: "right" },
});

function ThNum({ i, n, last }: { i: number; n: string; last?: boolean }) {
  return (
    <Text
      style={[s.thCell, { width: w(i) }, s.cellCenter, last ? { borderRightWidth: 0 } : {}]}
    >
      {n}
    </Text>
  );
}

function LeaveStack({ row, width }: { row: LeavePaymentRegisterRow; width: `${string}%` }) {
  return (
    <View style={[s.cell, { width }, s.cellCenter, { paddingVertical: 3 }]}>
      <Text style={{ fontSize: 4.2, lineHeight: 1.2, textAlign: "center" }}>
        {`Cl  ${formatMoneyWhole(row.daysCl)}\nEl  ${formatMoneyWhole(row.daysEl)}\nFl  ${formatMoneyWhole(row.daysFl)}\n———\n${formatMoneyWhole(row.daysLeaveTotal)}`}
      </Text>
    </View>
  );
}

function RateStack({ row, width }: { row: LeavePaymentRegisterRow; width: `${string}%` }) {
  return (
    <View style={[s.cell, { width }, s.cellCenter, { paddingVertical: 3 }]}>
      <Text style={{ fontSize: 4.2, lineHeight: 1.2, textAlign: "center" }}>
        {`${formatMoney2(row.basicRate)}\n${formatMoney2(row.daRate)}\n———\n${formatMoney2(row.rateTotal)}`}
      </Text>
    </View>
  );
}

interface Props {
  data: LeavePaymentRegisterData;
}

export function LeavePaymentRegisterPDF({ data }: Props) {
  const pages = chunkRows(data.rows, ROWS_PER_PAGE);
  const periodText = `From ${data.periodFromDisplay} To ${data.periodToDisplay}`;

  return (
    <Document>
      {pages.map((pageRows, pi) => {
        const isLast = pi === pages.length - 1;
        const startSl = pi * ROWS_PER_PAGE;
        return (
          <Page key={pi} size="A4" style={s.page} orientation="landscape">
            <View style={s.pageBody}>
              <View style={s.headerBox}>
                <View style={s.headerTopRow}>
                  <View style={s.headerLeft}>
                    <Text style={s.contractorLabel}>Name and Address Of Contractor:</Text>
                    <Text style={s.companyName}>{data.companyName}</Text>
                    <Text style={s.addressLine}>{data.officeLine}</Text>
                    <Text style={s.addressLine}>{data.correspondingLine}</Text>
                  </View>
                  <View style={s.headerCenter}>
                    <Text style={s.formTitleMain}>FORM XVII</Text>
                    <Text style={s.formRef}>[See Rule 78 (2) (a)]</Text>
                    <Text style={s.formTitleSub}>REGISTER OF LEAVE PAYMENT</Text>
                    <Text style={s.periodLine}>{periodText}</Text>
                  </View>
                  <View style={s.headerRight}>
                    <Text style={s.rightLabel}>
                      Name and Address of Establishment In/Under which contract is carried on:
                    </Text>
                    <Text style={s.rightValue}>{data.establishmentNameAddress || "—"}</Text>
                    <Text style={s.rightLabel}>Name and Address of Principal Employer:</Text>
                    <Text style={s.rightValue}>{data.principalEmployerNameAddress || "—"}</Text>
                  </View>
                </View>
                <View style={s.natureRow}>
                  <Text style={s.natureLabel}>Nature &amp; Location of Work:</Text>
                  <Text style={s.natureValue}>{data.natureLocationOfWork.trim() || "—"}</Text>
                </View>
                <View style={s.woRow}>
                  <Text style={s.natureLabel}>Work Order No.:</Text>
                  <Text style={s.natureValue}>{data.workOrderNumber.trim() || "—"}</Text>
                </View>
              </View>

              <View style={s.table}>
                {/* Row: column numbers */}
                <View style={s.thRow}>
                  <ThNum i={0} n="01" />
                  <ThNum i={1} n="02" />
                  <ThNum i={2} n="03" />
                  <ThNum i={3} n="04" />
                  <ThNum i={4} n="05" />
                  <ThNum i={5} n="06" />
                  <ThNum i={6} n="07" />
                  <ThNum i={7} n="08" />
                  <ThNum i={8} n="09" />
                  <ThNum i={9} n="10" />
                  <ThNum i={10} n="11" />
                  <ThNum i={11} n="12" />
                  <ThNum i={12} n="13" />
                  <ThNum i={13} n="13" />
                  <ThNum i={14} n="13" />
                  <ThNum i={15} n="14" />
                  <ThNum i={16} n="15" />
                  <ThNum i={17} n="16" />
                  <ThNum i={18} n="17" last />
                </View>

                {/* Row: main titles (merged areas) */}
                <View style={s.thRow}>
                  <Text style={[s.thCell, { width: w(0) }, s.cellCenter]}>Sl. No.</Text>
                  <Text style={[s.thCell, { width: w(1) }, s.cellCenter]}>Name of Workman</Text>
                  <Text style={[s.thCell, { width: w(2) }, s.cellCenter]}>
                    Serial No. in the{"\n"}Reg. of Workman
                  </Text>
                  <Text style={[s.thCell, { width: w(3) }, s.cellCenter]}>
                    Designation{"\n"}Nature of Work Done
                  </Text>
                  <Text style={[s.thCell, { width: w(4) }, s.cellCenter]}>No. of Days Worked</Text>
                  <Text style={[s.thCell, { width: w(5) }, s.cellCenter]}>
                    Unit{"\n"}Units Work Done
                  </Text>
                  <Text style={[s.thCell, { width: w(6) }, s.cellCenter]}>
                    Daily Rate{"\n"}Piece Rate
                  </Text>
                  <View style={[s.mergeTh, { width: wRange(7, 4) }]}>
                    <Text style={[s.cellCenter, { fontSize: 4.6 }]}>AMOUNT OF WAGES</Text>
                  </View>
                  <Text style={[s.thCell, { width: w(11) }, s.cellCenter]}>Total</Text>
                  <View style={[s.mergeTh, { width: wRange(12, 3) }]}>
                    <Text style={[s.cellCenter, { fontSize: 4.3 }]}>
                      Deduction if any{"\n"}(Indicate nature)
                    </Text>
                  </View>
                  <Text style={[s.thCell, { width: w(15) }, s.cellCenter]}>Net Amount Paid</Text>
                  <Text style={[s.thCell, { width: w(16) }, s.cellCenter]}>
                    Sig/Thumb{"\n"}Impression{"\n"}Work Man
                  </Text>
                  <Text style={[s.thCell, { width: w(17) }, s.cellCenter]}>
                    Initial Of Cont.{"\n"}or his Represen.
                  </Text>
                  <Text style={[s.thCell, { width: w(18) }, s.cellCenter, { borderRightWidth: 0 }]}>
                    Remarks
                  </Text>
                </View>

                {/* Row: wage & deduction sub-headings */}
                <View style={s.thRow}>
                  {Array.from({ length: 7 }, (_, i) => (
                    <Text key={i} style={[s.thCell, { width: w(i) }, s.cellCenter]} />
                  ))}
                  <Text style={[s.thCell, { width: w(7) }, s.cellCenter]}>Basic Wages</Text>
                  <Text style={[s.thCell, { width: w(8) }, s.cellCenter]}>DA</Text>
                  <Text style={[s.thCell, { width: w(9) }, s.cellCenter]}>Over Time</Text>
                  <Text style={[s.thCell, { width: w(10) }, s.cellCenter]}>Other Cash Payment</Text>
                  <Text style={[s.thCell, { width: w(11) }, s.cellCenter]} />
                  <Text style={[s.thCell, { width: w(12) }, s.cellCenter]}>PF</Text>
                  <Text style={[s.thCell, { width: w(13) }, s.cellCenter]}>ESI</Text>
                  <Text style={[s.thCell, { width: w(14) }, s.cellCenter]}>Others</Text>
                  <Text style={[s.thCell, { width: w(15) }, s.cellCenter]} />
                  <Text style={[s.thCell, { width: w(16) }, s.cellCenter]} />
                  <Text style={[s.thCell, { width: w(17) }, s.cellCenter]} />
                  <Text style={[s.thCell, { width: w(18) }, s.cellCenter, { borderRightWidth: 0 }]}> </Text>
                </View>

                {pageRows.map((row, idx) => (
                  <View key={`${row.employeeId}-${startSl + idx}`} style={s.row}>
                    <Text style={[s.cell, { width: w(0) }, s.cellCenter]}>{startSl + idx + 1}</Text>
                    <Text style={[s.cell, { width: w(1) }]}>{row.employeeName}</Text>
                    <Text style={[s.cell, { width: w(2) }, s.cellCenter]}>{row.workmanNo}</Text>
                    <Text style={[s.cell, { width: w(3) }]}>{row.designationNature}</Text>
                    <LeaveStack row={row} width={w(4)} />
                    <Text style={[s.cell, { width: w(5) }, s.cellCenter]} />
                    <RateStack row={row} width={w(6)} />
                    <Text style={[s.cell, { width: w(7) }, s.cellRight]}>{formatMoney2(row.sumBasicWages)}</Text>
                    <Text style={[s.cell, { width: w(8) }, s.cellRight]}>{formatMoney2(row.sumDa)}</Text>
                    <Text style={[s.cell, { width: w(9) }, s.cellRight]}>{formatMoney2(row.sumOvertime)}</Text>
                    <Text style={[s.cell, { width: w(10) }, s.cellRight]}>
                      {formatMoneyWhole(row.sumOtherCashPayment)}
                    </Text>
                    <Text style={[s.cell, { width: w(11) }, s.cellRight]}>{formatMoney2(row.sumTotalWages)}</Text>
                    <Text style={[s.cell, { width: w(12) }, s.cellRight]}>{formatMoneyWhole(row.sumPf)}</Text>
                    <Text style={[s.cell, { width: w(13) }, s.cellRight]}>{formatMoneyWhole(row.sumEsi)}</Text>
                    <Text style={[s.cell, { width: w(14) }, s.cellRight]}>
                      {formatMoneyWhole(row.sumOthersDeduction)}
                    </Text>
                    <Text style={[s.cell, { width: w(15) }, s.cellRight]}>{formatMoneyWhole(row.sumNetPaid)}</Text>
                    <Text style={[s.cell, { width: w(16) }]} />
                    <Text style={[s.cell, { width: w(17) }]} />
                    <Text style={[s.cell, { width: w(18) }, { borderRightWidth: 0 }]}>
                      {row.remarks}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {isLast ? (
              <View style={s.footerWrap} wrap={false}>
                <View style={s.footerRow}>
                  <View style={s.footerLeft}>
                    <Text>Paid</Text>
                    <Text style={{ marginTop: 6 }}>Unpaid</Text>
                  </View>
                  <View style={s.footerRight}>
                    <Text style={s.footerCert}>
                      Certified that the amount shown in{"\n"}
                      Column No. 14 has been paid to the workman concerned in my presence on
                    </Text>
                    <Text style={{ marginTop: 8 }}>______________________________</Text>
                    <Text style={s.footerSignLine}>Personal Manager</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </Page>
        );
      })}
    </Document>
  );
}
