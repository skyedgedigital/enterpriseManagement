import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { CONTRACTOR_ADDRESS, CONTRACTOR_NAME } from "@/lib/constants";

export interface ArrearRow {
  employeeName: string;
  workmanNo: string;
  designation: string;
  daysWorked: number;
  basicRate: number;
  daRate: number;
  basicAmount: number;
  daAmount: number;
  otherCash: number;
  grossWages: number;
  pf: number;
  esi: number;
  otherDeduction: number;
  netAmountPaid: number;
}

interface Props {
  rows: ArrearRow[];
  establishmentNameAddress?: string;
  workNameLocation?: string;
  principalEmployerNameAddress?: string;
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}

const COL = {
  sl: "3%",
  name: "9%",
  serial: "5.5%",
  desig: "7%",
  days: "4%",
  units: "3.5%",
  rate: "6%",
  basic: "5%",
  da: "5%",
  ot: "4%",
  otherCash: "6%",
  total: "5%",
  esi: "4%",
  pf: "4%",
  othDed: "4%",
  amtPaid: "5.5%",
  thumb: "7%",
  initial: "6%",
  sign: "6.5%",
};

const WAGES_GROUP_W = "25%";
const DEDUCTION_GROUP_W = "12%";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 5.8,
    color: "#000",
    padding: 10,
  },
  title: {
    textAlign: "center",
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  ruleRef: {
    textAlign: "center",
    fontSize: 6.2,
    marginBottom: 5,
  },
  period: {
    textAlign: "center",
    fontSize: 7.3,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  infoLeft: { width: "48%" },
  infoRight: { width: "48%" },
  label: { fontSize: 6, marginBottom: 1 },
  value: { fontSize: 6.4, fontFamily: "Helvetica-Bold" },

  table: { borderWidth: 1, borderColor: "#000" },

  hdrRow: {
    flexDirection: "row",
    backgroundColor: "#e5e5e5",
    fontFamily: "Helvetica-Bold",
    minHeight: 40,
    borderBottomWidth: 0.5,
    borderColor: "#000",
  },
  hdrCell: {
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 1,
  },
  hdrText: { textAlign: "center" },

  grp: {
    borderRightWidth: 0.5,
    borderColor: "#000",
  },
  grpTitle: {
    textAlign: "center",
    borderBottomWidth: 0.5,
    borderColor: "#000",
    padding: 2,
    fontFamily: "Helvetica-Bold",
    fontSize: 5.8,
  },
  grpSubs: {
    flexDirection: "row",
    flex: 1,
  },
  subCell: {
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 1,
  },

  numRow: {
    flexDirection: "row",
    backgroundColor: "#e5e5e5",
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  numCell: {
    textAlign: "center",
    borderRightWidth: 0.5,
    borderColor: "#000",
    padding: 1,
    fontSize: 5.5,
  },

  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: "#000",
  },
  cell: {
    padding: 2,
    borderRightWidth: 0.5,
    borderColor: "#000",
  },
  cCenter: { textAlign: "center" },
  cRight: { textAlign: "right" },
});

function rounded(n: number | null | undefined): string {
  return String(Math.round(n ?? 0));
}

export function ArrearPDF({
  rows,
  establishmentNameAddress = "",
  workNameLocation = "",
  principalEmployerNameAddress = "",
  fromMonth,
  fromYear,
  toMonth,
  toYear,
}: Props) {
  const periodLabel = `${fromYear}-${String(fromMonth).padStart(2, "0")} to ${toYear}-${String(toMonth).padStart(2, "0")}`;

  return (
    <Document>
      <Page size="A4" style={s.page} orientation="landscape">
        <Text style={s.title}>FORM XVII</Text>
        <Text style={s.ruleRef}>[See rule 78 (2) (a)]</Text>
        <Text style={s.ruleRef}>REGISTER OF WAGES</Text>

        <View style={s.infoRow}>
          <View style={s.infoLeft}>
            <Text style={s.label}>Name and Address of Contractor:</Text>
            <Text style={s.value}>
              {CONTRACTOR_NAME || "—"} {CONTRACTOR_ADDRESS || ""}
            </Text>
            <Text style={[s.label, { marginTop: 4 }]}>
              Name and Location of work:
            </Text>
            <Text style={s.value}>{workNameLocation || "—"}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.label}>
              Name and Address of Establishment in/ under which Contract is
              carried on:
            </Text>
            <Text style={s.value}>{establishmentNameAddress || "—"}</Text>
            <Text style={[s.label, { marginTop: 4 }]}>
              Name and Address of Principal Employer:
            </Text>
            <Text style={s.value}>
              {principalEmployerNameAddress || "—"}
            </Text>
          </View>
        </View>

        <Text style={s.period}>Wages Period {periodLabel}</Text>

        <View style={s.table}>
          <View style={s.hdrRow}>
            <View style={[s.hdrCell, { width: COL.sl }]}>
              <Text style={s.hdrText}>Sl. No.</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.name }]}>
              <Text style={s.hdrText}>Name of Workman</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.serial }]}>
              <Text style={s.hdrText}>Serial No. in Register of Workman</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.desig }]}>
              <Text style={s.hdrText}>
                Designation/ nature of Work done
              </Text>
            </View>
            <View style={[s.hdrCell, { width: COL.days }]}>
              <Text style={s.hdrText}>No. of days worked</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.units }]}>
              <Text style={s.hdrText}>Units of work done</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.rate }]}>
              <Text style={s.hdrText}>Daily rate of wages/ Piece rate</Text>
            </View>

            <View style={[s.grp, { width: WAGES_GROUP_W }]}>
              <Text style={s.grpTitle}>AMOUNT OF WAGES EARNED</Text>
              <View style={s.grpSubs}>
                <View style={[s.subCell, { width: "20%" }]}>
                  <Text style={s.hdrText}>Basic Wages</Text>
                </View>
                <View style={[s.subCell, { width: "20%" }]}>
                  <Text style={s.hdrText}>Dearness Allowance</Text>
                </View>
                <View style={[s.subCell, { width: "16%" }]}>
                  <Text style={s.hdrText}>Overtime</Text>
                </View>
                <View style={[s.subCell, { width: "24%" }]}>
                  <Text style={s.hdrText}>
                    Other Cash payment (nature of payment to be indicated)
                  </Text>
                </View>
                <View
                  style={[s.subCell, { width: "20%", borderRightWidth: 0 }]}
                >
                  <Text style={s.hdrText}>Total</Text>
                </View>
              </View>
            </View>

            <View style={[s.grp, { width: DEDUCTION_GROUP_W }]}>
              <Text style={s.grpTitle}>
                Deduction if any (indicate nature)
              </Text>
              <View style={s.grpSubs}>
                <View style={[s.subCell, { width: "33.33%" }]}>
                  <Text style={s.hdrText}>E.S.I</Text>
                </View>
                <View style={[s.subCell, { width: "33.33%" }]}>
                  <Text style={s.hdrText}>P.F</Text>
                </View>
                <View
                  style={[
                    s.subCell,
                    { width: "33.34%", borderRightWidth: 0 },
                  ]}
                >
                  <Text style={s.hdrText}>Others</Text>
                </View>
              </View>
            </View>

            <View style={[s.hdrCell, { width: COL.amtPaid }]}>
              <Text style={s.hdrText}>Amount Paid</Text>
            </View>
            <View style={[s.hdrCell, { width: COL.thumb }]}>
              <Text style={s.hdrText}>
                Signature/Thumb impression of workman
              </Text>
            </View>
            <View style={[s.hdrCell, { width: COL.initial }]}>
              <Text style={s.hdrText}>
                Initial of contractor or his representative
              </Text>
            </View>
            <View
              style={[s.hdrCell, { width: COL.sign, borderRightWidth: 0 }]}
            >
              <Text style={s.hdrText}>
                Signature of contractor or his representative
              </Text>
            </View>
          </View>

          <View style={s.numRow}>
            <Text style={[s.numCell, { width: COL.sl }]}>1</Text>
            <Text style={[s.numCell, { width: COL.name }]}>2</Text>
            <Text style={[s.numCell, { width: COL.serial }]}>3</Text>
            <Text style={[s.numCell, { width: COL.desig }]}>4</Text>
            <Text style={[s.numCell, { width: COL.days }]}>5</Text>
            <Text style={[s.numCell, { width: COL.units }]}>6</Text>
            <Text style={[s.numCell, { width: COL.rate }]}>7</Text>
            <Text style={[s.numCell, { width: COL.basic }]}>8</Text>
            <Text style={[s.numCell, { width: COL.da }]}>9</Text>
            <Text style={[s.numCell, { width: COL.ot }]}>10</Text>
            <Text style={[s.numCell, { width: COL.otherCash }]}>11</Text>
            <Text style={[s.numCell, { width: COL.total }]}>12</Text>
            <Text style={[s.numCell, { width: DEDUCTION_GROUP_W }]}>13</Text>
            <Text style={[s.numCell, { width: COL.amtPaid }]}>14</Text>
            <Text style={[s.numCell, { width: COL.thumb }]}>15</Text>
            <Text style={[s.numCell, { width: COL.initial }]}>16</Text>
            <Text
              style={[s.numCell, { width: COL.sign, borderRightWidth: 0 }]}
            >
              17
            </Text>
          </View>

          {rows.map((row, idx) => (
            <View
              key={`${row.workmanNo}-${row.employeeName}-${idx}`}
              style={s.dataRow}
            >
              <Text style={[s.cell, { width: COL.sl }, s.cCenter]}>
                {idx + 1}
              </Text>
              <Text style={[s.cell, { width: COL.name }]}>
                {row.employeeName}
              </Text>
              <Text style={[s.cell, { width: COL.serial }, s.cCenter]}>
                {row.workmanNo || "—"}
              </Text>
              <Text style={[s.cell, { width: COL.desig }]}>
                {row.designation || "—"}
              </Text>
              <Text style={[s.cell, { width: COL.days }, s.cCenter]}>
                {row.daysWorked}
              </Text>
              <Text style={[s.cell, { width: COL.units }, s.cCenter]}>
                —
              </Text>
              <Text style={[s.cell, { width: COL.rate }, s.cCenter]}>
                {rounded(row.basicRate)}+{rounded(row.daRate)}
              </Text>
              <Text style={[s.cell, { width: COL.basic }, s.cRight]}>
                {rounded(row.basicAmount)}
              </Text>
              <Text style={[s.cell, { width: COL.da }, s.cRight]}>
                {rounded(row.daAmount)}
              </Text>
              <Text style={[s.cell, { width: COL.ot }, s.cRight]}>0</Text>
              <Text style={[s.cell, { width: COL.otherCash }, s.cRight]}>
                {rounded(row.otherCash)}
              </Text>
              <Text style={[s.cell, { width: COL.total }, s.cRight]}>
                {rounded(row.grossWages)}
              </Text>
              <Text style={[s.cell, { width: COL.esi }, s.cRight]}>
                {rounded(row.esi)}
              </Text>
              <Text style={[s.cell, { width: COL.pf }, s.cRight]}>
                {rounded(row.pf)}
              </Text>
              <Text style={[s.cell, { width: COL.othDed }, s.cRight]}>
                {rounded(row.otherDeduction)}
              </Text>
              <Text style={[s.cell, { width: COL.amtPaid }, s.cRight]}>
                {rounded(row.netAmountPaid)}
              </Text>
              <Text style={[s.cell, { width: COL.thumb }]} />
              <Text style={[s.cell, { width: COL.initial }]} />
              <Text
                style={[
                  s.cell,
                  { width: COL.sign, borderRightWidth: 0 },
                ]}
              />
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
