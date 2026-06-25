import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { FullAndFinalData } from "@/lib/buildFullAndFinalData";
import { formatMoneyWhole } from "@/lib/moneyRounding";

const BORDER = "#000";
const FONT = 8;
const FONT_SMALL = 7;
const FONT_BOLD = "Helvetica-Bold";
const FONT_NORMAL = "Helvetica";

const s = StyleSheet.create({
  page: {
    fontFamily: FONT_NORMAL,
    fontSize: FONT,
    color: "#000",
    padding: 24,
    lineHeight: 1.25,
  },

  sectionHeading: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
  },

  /* ---- Workman Details label/value grid ---- */
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailCell: {
    width: "33.33%",
    paddingVertical: 3,
    paddingRight: 6,
  },
  detailCellHalf: {
    width: "50%",
    paddingVertical: 3,
    paddingRight: 6,
  },
  detailLabel: {
    fontFamily: FONT_BOLD,
    fontSize: FONT_SMALL,
    color: "#333",
  },
  detailValue: {
    fontFamily: FONT_BOLD,
    fontSize: FONT,
    marginTop: 1,
  },

  /* ---- Month table (Attendance / Gross Wages) ---- */
  tbl: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 2,
  },
  tblRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  tblRowLast: {
    flexDirection: "row",
  },
  tblHead: {
    backgroundColor: "#eee",
  },
  tblCell: {
    padding: 3,
    borderRightWidth: 0.5,
    borderColor: BORDER,
    fontSize: FONT_SMALL,
    justifyContent: "center",
  },
  tblCellLast: {
    padding: 3,
    fontSize: FONT_SMALL,
    justifyContent: "center",
  },
  tblBold: { fontFamily: FONT_BOLD },
  tblCenter: { textAlign: "center" },
  tblRight: { textAlign: "right" },

  /* ---- Component calculation table ---- */
  compTbl: {
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
  },
  compRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  compRowLast: {
    flexDirection: "row",
  },
  compHeadCell: {
    padding: 4,
    borderRightWidth: 0.5,
    borderColor: BORDER,
    fontFamily: FONT_BOLD,
    fontSize: FONT_SMALL,
    textAlign: "center",
    backgroundColor: "#eee",
  },
  compHeadCellLast: {
    padding: 4,
    fontFamily: FONT_BOLD,
    fontSize: FONT_SMALL,
    textAlign: "center",
    backgroundColor: "#eee",
  },
  compCell: {
    padding: 4,
    borderRightWidth: 0.5,
    borderColor: BORDER,
    fontSize: FONT_SMALL,
    justifyContent: "center",
  },
  compCellLast: {
    padding: 4,
    fontSize: FONT_SMALL,
    justifyContent: "center",
  },
  compCellBold: { fontFamily: FONT_BOLD },
  compAmountRight: { textAlign: "right" },

  /* ---- Deductions mini-table ---- */
  dedTbl: {
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 4,
    width: "60%",
  },

  /* ---- Paragraphs & declarations ---- */
  para: {
    marginTop: 6,
    fontSize: FONT,
    textAlign: "justify",
  },
  paraBold: {
    marginTop: 6,
    fontSize: FONT,
    textAlign: "justify",
    fontFamily: FONT_BOLD,
  },
  underlineHeading: {
    fontFamily: FONT_BOLD,
    fontSize: FONT,
    textDecoration: "underline",
    marginTop: 8,
  },
  signLine: {
    marginTop: 16,
    fontSize: FONT,
  },
  signName: {
    marginTop: 2,
    fontFamily: FONT_BOLD,
    fontSize: FONT,
  },
});

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface Props {
  data: FullAndFinalData;
}

function fmt2(n: number): string {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(2);
}

function fmtInt(n: number): string {
  return String(Math.round(n));
}

function todayDdMmYyyy(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function todayTimestamp(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = d.getHours() % 12 || 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
  return `${mm}/${dd}/${d.getFullYear()} ${hh}:${min}:${ss} ${ampm}`;
}

export function FullAndFinalPDF({ data }: Props) {
  const rateDisplay =
    data.ratePayTotal > 0
      ? `Rs. ${fmt2(data.ratePayTotal)} (${fmt2(data.ratePayBasic)} + ${fmt2(data.ratePayDa)})`
      : "—";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* =================== Workman Details =================== */}
        <Text style={s.sectionHeading}>Workman Details</Text>
        <View style={s.detailsGrid}>
          <Detail label="Workman Name" value={data.employeeName} />
          <Detail label="Service Period" value={`${data.servicePeriodFrom} - ${data.servicePeriodTo}`} />
          <Detail label="Vendor Code" value={data.vendorCode} />
          <Detail label="Date of Joining Vendor (dd/MM/yyyy)" value={data.dateOfEmployment} />
          <Detail label="Rate of Pay (Basic+VDA)" value={rateDisplay} />
          <Detail label="Workman Designation" value={data.workmanDesignation} />
          <Detail label="Previous Year Leave?" value={data.previousYearLeaveCleared ? "Yes" : "No"} />
          <Detail label="Previous Year Bonus?" value={data.previousYearBonusCleared ? "Yes" : "No"} />
          <Detail label="Make Balance Attendance Entry?" value={data.makeBalanceAttendanceEntry ? "Yes" : "No"} />
          <Detail label="Mode of Separation" value={data.modeOfSeparation || "—"} />
        </View>

        {/* =================== Attendance Details =================== */}
        <Text style={s.sectionHeading}>Attendance Details</Text>
        <MonthTable
          header="Year/Month"
          rows={data.years.map((y) => ({
            label: y.label,
            values: y.months.map((m) => fmtInt(m.daysWorked)),
            total: fmtInt(y.totalDays),
          }))}
        />

        {/* =================== Gross Wages =================== */}
        <Text style={s.sectionHeading}>Gross Wages (Basic+VDA)</Text>
        <MonthTable
          header="Year/Month"
          rows={data.years.map((y) => ({
            label: y.label,
            values: y.months.map((m) => (m.gross === 0 ? "0" : fmt2(m.gross))),
            total: fmt2(y.totalGross),
          }))}
        />

        {/* =================== Component table =================== */}
        <ComponentTable data={data} />

        {/* =================== Deductions =================== */}
        {data.deductionLines.length > 0 && (
          <>
            <Text style={s.sectionHeading}>Deductions</Text>
            <View style={s.dedTbl}>
              {data.deductionLines.map((d, i) => (
                <View key={`${d.label}-${i}`} style={s.compRow}>
                  <View style={[s.compCell, { width: "70%" }]}>
                    <Text>{d.label}</Text>
                  </View>
                  <View style={[s.compCellLast, s.compAmountRight, { width: "30%" }]}>
                    <Text>Rs. {fmt2(d.amount)}</Text>
                  </View>
                </View>
              ))}
              <View style={s.compRowLast}>
                <View style={[s.compCell, s.compCellBold, { width: "70%" }]}>
                  <Text>Total Deductions</Text>
                </View>
                <View
                  style={[
                    s.compCellLast,
                    s.compCellBold,
                    s.compAmountRight,
                    { width: "30%" },
                  ]}
                >
                  <Text>Rs. {fmt2(data.totalDeductions)}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* =================== Workman Declaration =================== */}
        <Text style={s.underlineHeading}>Workman Declaration:</Text>
        <Text style={s.paraBold}>
          Received a sum of Rs. {fmt2(data.netPayable)} (post deduction of Rs.{" "}
          {fmt2(data.totalDeductions)}) on {todayDdMmYyyy()} as Full and Final
          Settlement for my service with M/s {data.contractorName.toUpperCase()}{" "}
          for the working period {data.servicePeriodFrom}-
          {data.servicePeriodTo}.
        </Text>

        <Text style={s.signLine}>Sign/L.T.I. of workman</Text>
        <Text style={s.signName}>{data.employeeName.toUpperCase()}</Text>

        {/* =================== Acknowledgement =================== */}
        <Text style={s.underlineHeading}>Acknowledgement:</Text>
        <Text style={s.para}>
          I the under signed................... Proprietor of the firm{" "}
          {data.contractorName.toUpperCase()} ({data.vendorCode}) guarantee
          that the calculation sheet of final settlement of each of my employee
          generated through CLM has been thoroughly validated with the records
          available with us. Any discrepancy in future in form of any complaint
          of the concerned employee will be settled by us.
        </Text>

        {/* =================== Indemnity =================== */}
        <Text style={s.underlineHeading}>INDEMNITY BOND-CUM-DECLARATION:</Text>
        <Text style={s.para}>
          M/s. {data.contractorName.toUpperCase()} hereby unconditionally &amp;
          irrevocably agrees to indemnify M/s. Tata Steel Ltd. against
          liabilities of Mr./Ms. {data.employeeName.toUpperCase()} towards
          payment of gratuity for the period during he/she was associated with
          us and the same is not disclosed to M/s Tata Steel Ltd. We also
          indemnify M/s Tata Steel Ltd. against any further liability and/or
          penalty &amp; action by whatever name it may be called arising out of
          any demand for or on behalf of him/her by any statutory authorities
          and/or any action or proceeding thereunder.
        </Text>
        <Text style={s.paraBold}>
          I the under signed am responsible to pay for all such dues in a
          timely manner.
        </Text>

        {/* =================== Date & Signature =================== */}
        <Text style={s.signLine}>Date: ({todayTimestamp()})</Text>
        <Text style={s.signLine}>Signature: ({data.contractorName.toUpperCase()})</Text>
        <Text style={{ marginTop: 2, fontSize: FONT }}>
          Sign of contractor with seal
        </Text>

        {/* =================== Disclaimer =================== */}
        <Text style={s.underlineHeading}>Disclaimer:</Text>
        <Text style={s.paraBold}>
          The above amount is an approximate settlement amount calculated by
          the system. This amount may vary from the actual dues payable to the
          employee. Contractor/Vendor is requested to verify the same.
        </Text>
      </Page>
    </Document>
  );
}

/* ---------- helper sub-components ---------- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailCell}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value || "—"}</Text>
    </View>
  );
}

interface MonthTableRow {
  label: string;
  values: string[]; // 12 entries
  total: string;
}

function MonthTable({
  header,
  rows,
}: {
  header: string;
  rows: MonthTableRow[];
}) {
  // columns: Year/Month | 12 months | Total
  const labelCol = 14;
  const totalCol = 10;
  const monthCol = (100 - labelCol - totalCol) / 12;

  return (
    <View style={s.tbl}>
      {/* Header */}
      <View style={[s.tblRow, s.tblHead]}>
        <View style={[s.tblCell, s.tblBold, s.tblCenter, { width: `${labelCol}%` }]}>
          <Text>{header}</Text>
        </View>
        {MONTH_SHORT.map((m) => (
          <View
            key={m}
            style={[s.tblCell, s.tblBold, s.tblCenter, { width: `${monthCol}%` }]}
          >
            <Text>{m}</Text>
          </View>
        ))}
        <View
          style={[s.tblCellLast, s.tblBold, s.tblCenter, { width: `${totalCol}%` }]}
        >
          <Text>Total</Text>
        </View>
      </View>

      {/* Body */}
      {rows.length === 0 ? (
        <View style={s.tblRowLast}>
          <View style={[s.tblCellLast, { width: "100%" }]}>
            <Text> </Text>
          </View>
        </View>
      ) : (
        rows.map((r, ri) => {
          const isLast = ri === rows.length - 1;
          return (
            <View key={r.label} style={isLast ? s.tblRowLast : s.tblRow}>
              <View style={[s.tblCell, s.tblCenter, { width: `${labelCol}%` }]}>
                <Text>{r.label}</Text>
              </View>
              {r.values.map((v, i) => (
                <View
                  key={i}
                  style={[s.tblCell, s.tblRight, { width: `${monthCol}%` }]}
                >
                  <Text>{v}</Text>
                </View>
              ))}
              <View
                style={[
                  s.tblCellLast,
                  s.tblRight,
                  s.tblBold,
                  { width: `${totalCol}%` },
                ]}
              >
                <Text>{r.total}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

interface ComponentRow {
  name: string;
  definition: string;
  eligibility: string;
  amount: string;
}

function ComponentTable({ data }: { data: FullAndFinalData }) {
  const rows: ComponentRow[] = [
    {
      name: "Unpaid Wages",
      definition: "Wage calculation for working days for current month",
      eligibility: `Days Worked in Current Month: ${fmtInt(data.unpaidWagesDays)}`,
      amount: `Rs. ${fmt2(data.unpaidWages)}`,
    },
    {
      name: "Leave",
      definition:
        "Earned leave calculated in current calendar year after deducting availed earned leave in the calendar year. Earned leave is 1 for every 20 days worked in a calendar year",
      eligibility:
        `Days worked in Calendar Year: ${fmtInt(data.grandTotalDays)}\n` +
        `No. of earned leave eligible: ${fmtInt(data.elTotal)}\n` +
        `No. of EL availed: ${fmtInt(data.leaveAvailedDays)}\n` +
        `Balance EL: ${fmtInt(data.balanceLeaveDays)}`,
      amount: `Rs. ${fmt2(data.leaveAmountMonetary)}`,
    },
    {
      name: "Bonus",
      definition:
        "Bonus eligibility of current financial year is to be auto-calculated as 8.33% of total Basic+VDA of current FY in case employee has worked minimum 30 days in a FY; else system to calculate bonus eligibility as nil. In case of employee having gross wages more than Rs.21,000 p.m. bonus is not applicable.",
      eligibility:
        `No of days worked in FY: ${fmtInt(data.currentFYDaysWorked)}\n` +
        `8.33% of gross wages payable`,
      amount: `Rs. ${fmt2(data.bonusAmount)}`,
    },
    {
      name: "Previous FY Bonus",
      definition:
        "Bonus eligibility of previous financial year is to be auto-calculated as 8.33% of total Basic+VDA of previous FY in case employee has worked minimum 30 days in a FY; else system to calculate bonus eligibility as nil. In case of employee having gross wages more than Rs.21,000 p.m. bonus is not applicable.",
      eligibility:
        `No of days worked in FY: ${fmtInt(data.previousFYDaysWorked)}\n` +
        `8.33% of gross wages payable`,
      amount: `Rs. ${fmt2(data.previousFYBonusAmount)}`,
    },
    {
      name: "Gratuity",
      definition:
        "A contract worker who must work continuously 5 years, within 5 years last year if he worked for 240 days should also be considered as a completed year-will be eligible for gratuity payment. Gratuity is thus calculated for every completed year as last drawn (Basic + DA) * 15 days",
      eligibility: `Gratuity payable for ${
        data.gratuityYears > 0 ? `${data.gratuityYears}` : "N/A"
      } years`,
      amount: `Rs. ${fmt2(data.gratuityAmount)}`,
    },
    {
      name: "Retrenchment",
      definition:
        "Retrenchment benefit is calculated as:\n" +
        "(i) In any completed year if contract worker worked more than 240 days, he will be eligible for 15 days retrenchment benefit for every completed year.\n" +
        "(ii) Meaning of 240 days- working days, any type of leave (including CL/FL/PL), any authorised sick leave without pay (excluding LWP) are to be considered as days worked.\n" +
        "(iii) In 240 days completion; the encashment of no. of days of leave should also be included.\n" +
        "(iv) If last completed year, the contract worker has worked for more than 6 months but not completed 12 months of service and if in first 6 months; he has completed 120 days; he will be eligible for 15 days retrenchment benefit.",
      eligibility: `Completed Years of Service: ${
        data.completedYearsOfService > 0
          ? `${data.completedYearsOfService}`
          : "N/A"
      }`,
      amount: `Rs. ${fmt2(data.retrenchmentAmount)}`,
    },
    {
      name: "Notice Pay",
      definition:
        "Notice pay is payable in lieu of notice as defined in the Industrial Disputes Act. An employer is required to give at least one month's advance notice or payment in lieu thereof to a worker who has completed at least one year of continuous service before termination. It is to be nil in case mode of separation is 'Resignation by workman' else notice pay to be calculated as 26 days (in case total no. of working days is 240 from DOJ) else 3 days of (Basic+VDA) amount of last drawn wages.",
      eligibility:
        `Mode of Separation: ${data.modeOfSeparation || "N/A"}\n` +
        `No of days worked: ${fmtInt(data.grandTotalDays)}`,
      amount: `Rs. ${fmt2(data.noticePay)}`,
    },
  ];

  const w = { comp: 14, def: 48, elig: 22, amt: 16 };

  return (
    <View style={s.compTbl}>
      {/* Header */}
      <View style={s.compRow}>
        <View style={[s.compHeadCell, { width: `${w.comp}%` }]}>
          <Text>Component</Text>
        </View>
        <View style={[s.compHeadCell, { width: `${w.def}%` }]}>
          <Text>Definition</Text>
        </View>
        <View style={[s.compHeadCell, { width: `${w.elig}%` }]}>
          <Text>Eligibility (No of days)</Text>
        </View>
        <View style={[s.compHeadCellLast, { width: `${w.amt}%` }]}>
          <Text>Final Amount Calculation (Rs.)</Text>
        </View>
      </View>

      {/* Body */}
      {rows.map((r, i) => {
        const isLast = i === rows.length - 1;
        return (
          <View key={r.name} style={isLast ? s.compRowLast : s.compRow}>
            <View
              style={[
                s.compCell,
                s.compCellBold,
                { width: `${w.comp}%`, textAlign: "center" },
              ]}
            >
              <Text>{r.name}</Text>
            </View>
            <View style={[s.compCell, { width: `${w.def}%` }]}>
              <Text>{r.definition}</Text>
            </View>
            <View style={[s.compCell, { width: `${w.elig}%` }]}>
              <Text>{r.eligibility}</Text>
            </View>
            <View
              style={[
                s.compCellLast,
                s.compCellBold,
                s.compAmountRight,
                { width: `${w.amt}%` },
              ]}
            >
              <Text>{r.amount}</Text>
            </View>
          </View>
        );
      })}

      {/* Grand total row */}
      <View style={[s.compRowLast, { borderTopWidth: 0.5, borderColor: BORDER }]}>
        <View
          style={[
            s.compCell,
            s.compCellBold,
            { width: `${w.comp + w.def + w.elig}%` },
          ]}
        >
          <Text>Total amount towards Full &amp; Final Settlement</Text>
        </View>
        <View
          style={[
            s.compCellLast,
            s.compCellBold,
            s.compAmountRight,
            { width: `${w.amt}%` },
          ]}
        >
          <Text>Rs. {formatMoneyWhole(data.totalFullAndFinal)}</Text>
        </View>
      </View>
    </View>
  );
}
