import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { WagesPaySlipData } from "./WagesPaySlipPDF";
import { CONTRACTOR_ADDRESS, CONTRACTOR_NAME } from "@/lib/constants";
import { formatINR, formatMonthYear } from "@/lib/pdfUtils";

interface Props {
  slips: WagesPaySlipData[];
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 6.6,
    color: "#000",
    padding: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  slip: {
    width: "49%",
    height: "49%",
    borderWidth: 1,
    borderColor: "#000",
    padding: 5,
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 3,
  },
  headerLeft: {
    width: "24%",
    fontSize: 6.8,
  },
  headerCenter: {
    width: "52%",
    textAlign: "center",
    fontSize: 8.6,
  },
  headerRight: {
    width: "24%",
    textAlign: "right",
    fontSize: 6.8,
  },
  contractorRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  contractorLabel: {
    width: "35%",
  },
  contractorValue: {
    width: "65%",
    lineHeight: 1.15,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 1,
    marginBottom: 3,
  },
  sectionTitle: {
    marginBottom: 1,
  },
  contractRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  leftBlock: {
    width: "64%",
    flexDirection: "row",
  },
  rightBlock: {
    width: "35%",
    flexDirection: "row",
  },
  key: {
  },
  value: {
  },
  details: {
    marginTop: 2,
    marginBottom: 2,
  },
  line: {
    flexDirection: "row",
    marginBottom: 1,
  },
  lineLabel: {
  },
  lineValue: {
    marginLeft: 3,
  },
  signature: {
    marginTop: 3,
  },
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function SlipCard({ data }: { data: WagesPaySlipData }) {
  const rounded = (n: number | null | undefined): string =>
    String(Math.round(n ?? 0));
  return (
    <View style={s.slip}>
      <View style={s.headerRow}>
        <Text style={s.headerLeft}>FOR XIX</Text>
        <Text style={s.headerCenter}>WAGES SLIP</Text>
        <Text style={s.headerRight}>[ See Rule 78 (2) (B) ]</Text>
      </View>

      <View style={s.contractorRow}>
        <Text style={s.contractorLabel}>Name & Address of Contractor :</Text>
        <Text style={s.contractorValue}>
          {CONTRACTOR_NAME}, {CONTRACTOR_ADDRESS}
        </Text>
      </View>

      <View style={s.divider} />

      <Text style={s.sectionTitle}>Contract Under</Text>
      <View style={s.contractRow}>
        <View style={s.leftBlock}>
          <Text style={s.key}>Name of Workman :</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>{data.employeeName}</Text>
        </View>
        <View style={s.rightBlock}>
          <Text style={s.key}>Workman No</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>{data.workmanNo || "-"}</Text>
        </View>
      </View>

      <View style={s.contractRow}>
        <View style={s.leftBlock}>
          <Text style={s.key}>For the Month :</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>
            {formatMonthYear(data.month, data.year)}
          </Text>
        </View>
        <View style={s.rightBlock}>
          <Text style={s.key}>A/c No.</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>{data.accountNumber || "-"}</Text>
        </View>
      </View>

      <View style={s.contractRow}>
        <View style={s.leftBlock}>
          <Text style={s.key} />
        </View>
        <View style={s.rightBlock}>
          <Text style={s.key}>UAN</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>{data.uan || "-"}</Text>
        </View>
      </View>

      <View style={s.contractRow}>
        <View style={s.leftBlock}>
          <Text style={s.key} />
        </View>
        <View style={s.rightBlock}>
          <Text style={s.key}>ESIC No.</Text>
          <Text style={[s.value, { marginLeft: 2 }]}>{data.esicNo || "-"}</Text>
        </View>
      </View>

      <View style={s.details}>
        <View style={s.line}>
          <Text style={s.lineLabel}>1. No. of Days Worked :</Text>
          <Text style={s.lineValue}>{data.daysWorked}</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>2. No. of Units Worked in Case of Piece Rate of Work :</Text>
          <Text style={s.lineValue}>-</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>3. Rate of Daily Wages @ Piece Rate :</Text>
          <Text style={s.lineValue}>
            {rounded(data.basicRate)} + {rounded(data.daRate)} = {rounded(data.payRate)}
          </Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>4. Amount of Wages :</Text>
          <Text style={s.lineValue}>
            {rounded(data.basicAmount)} + {rounded(data.daAmount)} + {rounded(data.otherCash)}
          </Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>5. Amount of Overtime Wages :</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>6. Gross Wages Payable :</Text>
          <Text style={s.lineValue}>{formatINR(data.grossWages)}</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>7. Deduction if Any Advance :</Text>
          <Text style={s.lineValue}>{rounded(data.advanceDeduction)}</Text>
          <Text style={[s.lineLabel, { marginLeft: 6 }]}>Deduction if Any Damage :</Text>
          <Text style={s.lineValue}>{rounded(data.damageDeduction)}</Text>
          <Text style={[s.lineLabel, { marginLeft: 6 }]}>PF:</Text>
          <Text style={s.lineValue}>{rounded(data.pf)}</Text>
          <Text style={[s.lineLabel, { marginLeft: 6 }]}>ESI:</Text>
          <Text style={s.lineValue}>{rounded(data.esi)}</Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>8. Total Incentive amount :</Text>
          <Text style={s.lineValue}>
            {data.incentiveAmount != null ? rounded(data.incentiveAmount) : "NA"}
          </Text>
        </View>
        <View style={s.line}>
          <Text style={s.lineLabel}>9. Net Amount of Wages Paid :</Text>
          <Text style={s.lineValue}>{rounded(data.netAmountPaid)}</Text>
        </View>
      </View>

      <Text style={s.signature}>Initial of Contractor or his Representative</Text>
    </View>
  );
}

export function WagesSlipBundlePDF({ slips }: Props) {
  const pages = chunk(slips, 4);
  return (
    <Document>
      {pages.map((pageSlips, pageIdx) => (
        <Page key={pageIdx} size="A4" style={s.page}>
          <View style={s.grid}>
            {pageSlips.map((data, idx) => (
              <SlipCard
                key={`${data.workmanNo}-${data.employeeName}-${pageIdx}-${idx}`}
                data={data}
              />
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
