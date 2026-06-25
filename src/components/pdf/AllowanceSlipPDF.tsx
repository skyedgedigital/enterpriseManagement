import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatMoney2, formatMoneyWhole } from "@/lib/moneyRounding";
import { formatMonthYear } from "@/lib/pdfUtils";

export interface AllowanceSlipRow {
  slNo: number;
  employeeName: string;
  employeeCode: string;
  presentDays: number;
  nh: number;
  hra: number;
  monthlyMobileAllowance: number;
  monthlyIncumbentAllowance: number;
  earnedOtherCash: number;
  performanceBonus: number;
  washingAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  siteSpecificAllowance: number;
  otherAllowance: number;
  grandTotal: number;
}

interface AllowanceSlipData {
  month: number;
  year: number;
  contractorNameAddress: string;
  establishmentNameAddress: string;
  workNameLocation: string;
  principalEmployerNameAddress: string;
  rows: AllowanceSlipRow[];
}

interface Props {
  data: AllowanceSlipData;
}

const BORDER = "0.6pt solid #000";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#000",
    padding: 10,
  },
  border: {
    border: "1pt solid #000",
    padding: 8,
    flexGrow: 1,
  },
  center: { textAlign: "center" },
  mb2: { marginBottom: 2 },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  metaBox: {
    width: "48%",
    flexDirection: "row",
  },
  metaLabel: {
    width: "38%",
  },
  metaValue: {
    width: "62%",
  },
  monthText: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 6,
  },
  table: {
    width: "100%",
    borderTop: BORDER,
    borderLeft: BORDER,
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
    textAlign: "center",
  },
  cell: {
    borderRight: BORDER,
    borderBottom: BORDER,
    padding: 2,
  },
  right: { textAlign: "right" },
});

const COL = {
  slNo: 22,
  employeeName: 84,
  employeeCode: 40,
  presentDays: 38,
  nh: 22,
  hra: 24,
  monthlyMobileAllowance: 58,
  monthlyIncumbentAllowance: 60,
  earnedOtherCash: 64,
  performanceBonus: 54,
  washingAllowance: 50,
  conveyanceAllowance: 54,
  medicalAllowance: 50,
  siteSpecificAllowance: 62,
  otherAllowance: 48,
  grandTotal: 34,
};

export function AllowanceSlipPDF({ data }: Props) {
  const totalWidth = Object.values(COL).reduce((a, b) => a + b, 0);
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.border}>
          <Text style={[s.center, s.mb2]}>Allowance Receipt</Text>
          <Text style={[s.center, s.mb2]}>[See rule 78 (2) (a)]</Text>
          <Text style={[s.center, s.mb8]}>MUSTER ROLL</Text>

          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Name and Address of Contractor:</Text>
              <Text style={s.metaValue}>{data.contractorNameAddress}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Name and Address of Establishment in/ under which Contract is carried on:</Text>
              <Text style={s.metaValue}>{data.establishmentNameAddress}</Text>
            </View>
          </View>

          <View style={s.metaRow}>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Name and Location of work:</Text>
              <Text style={s.metaValue}>{data.workNameLocation}</Text>
            </View>
            <View style={s.metaBox}>
              <Text style={s.metaLabel}>Name and Address of Principal Employer:</Text>
              <Text style={s.metaValue}>{data.principalEmployerNameAddress}</Text>
            </View>
          </View>

          <Text style={s.monthText}>For the Month of {formatMonthYear(data.month, data.year)}</Text>

          <View style={[s.table, { width: totalWidth }]}>
            <View style={s.row}>
              <Text style={[s.headerCell, { width: COL.slNo }]} />
              <Text style={[s.headerCell, { width: COL.employeeName }]} />
              <Text style={[s.headerCell, { width: COL.employeeCode }]} />
              <Text style={[s.headerCell, { width: COL.presentDays }]} />
              <Text style={[s.headerCell, { width: COL.nh }]} />
              <Text style={[s.headerCell, { width: COL.hra }]} />
              <Text style={[s.headerCell, { width: totalWidth - (COL.slNo + COL.employeeName + COL.employeeCode + COL.presentDays + COL.nh + COL.hra + COL.grandTotal) }]}>
                Addition
              </Text>
              <Text style={[s.headerCell, { width: COL.grandTotal }]} />
            </View>

            <View style={s.row}>
              <Text style={[s.headerCell, { width: COL.slNo }]}>Sl No.</Text>
              <Text style={[s.headerCell, { width: COL.employeeName }]}>Employee Name</Text>
              <Text style={[s.headerCell, { width: COL.employeeCode }]}>Emp. Code</Text>
              <Text style={[s.headerCell, { width: COL.presentDays }]}>Present Days</Text>
              <Text style={[s.headerCell, { width: COL.nh }]}>NH</Text>
              <Text style={[s.headerCell, { width: COL.hra }]}>HRA</Text>
              <Text style={[s.headerCell, { width: COL.monthlyMobileAllowance }]}>Monthly Mobile Allowance</Text>
              <Text style={[s.headerCell, { width: COL.monthlyIncumbentAllowance }]}>Monthly Incumbent Allowance</Text>
              <Text style={[s.headerCell, { width: COL.earnedOtherCash }]}>Earned Other Cash</Text>
              <Text style={[s.headerCell, { width: COL.performanceBonus }]}>Performance Bonus</Text>
              <Text style={[s.headerCell, { width: COL.washingAllowance }]}>Washing Allowance</Text>
              <Text style={[s.headerCell, { width: COL.conveyanceAllowance }]}>Conveyance Allowance</Text>
              <Text style={[s.headerCell, { width: COL.medicalAllowance }]}>Medical Allowance</Text>
              <Text style={[s.headerCell, { width: COL.siteSpecificAllowance }]}>Site Specific Allowance</Text>
              <Text style={[s.headerCell, { width: COL.otherAllowance }]}>Other Allowance</Text>
              <Text style={[s.headerCell, { width: COL.grandTotal }]}>Grand Total</Text>
            </View>

            {data.rows.map((r) => (
              <View key={`${r.employeeCode}-${r.slNo}`} style={s.row} wrap={false}>
                <Text style={[s.cell, { width: COL.slNo }]}>{r.slNo}</Text>
                <Text style={[s.cell, { width: COL.employeeName }]}>{r.employeeName}</Text>
                <Text style={[s.cell, { width: COL.employeeCode }]}>{r.employeeCode}</Text>
                <Text style={[s.cell, s.right, { width: COL.presentDays }]}>{formatMoney2(r.presentDays)}</Text>
                <Text style={[s.cell, s.right, { width: COL.nh }]}>{formatMoney2(r.nh)}</Text>
                <Text style={[s.cell, s.right, { width: COL.hra }]}>{formatMoney2(r.hra)}</Text>
                <Text style={[s.cell, s.right, { width: COL.monthlyMobileAllowance }]}>{formatMoney2(r.monthlyMobileAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.monthlyIncumbentAllowance }]}>{formatMoney2(r.monthlyIncumbentAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.earnedOtherCash }]}>{formatMoneyWhole(r.earnedOtherCash)}</Text>
                <Text style={[s.cell, s.right, { width: COL.performanceBonus }]}>{formatMoney2(r.performanceBonus)}</Text>
                <Text style={[s.cell, s.right, { width: COL.washingAllowance }]}>{formatMoney2(r.washingAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.conveyanceAllowance }]}>{formatMoney2(r.conveyanceAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.medicalAllowance }]}>{formatMoney2(r.medicalAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.siteSpecificAllowance }]}>{formatMoney2(r.siteSpecificAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.otherAllowance }]}>{formatMoney2(r.otherAllowance)}</Text>
                <Text style={[s.cell, s.right, { width: COL.grandTotal }]}>{formatMoney2(r.grandTotal)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
