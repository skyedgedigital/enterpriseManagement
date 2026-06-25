import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDFFormHeader, PDFContractorBlock, PDFFieldRow } from "./primitives";
import { formatMonthYear } from "@/lib/pdfUtils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FormXVIRow {
  serialNo: number;
  name: string;
  fatherName: string;
  sex: string;
  days: string[];
  totalAttendance: number;
  remarks: string;
}

export interface FormXVIData {
  location: string;
  employer: string;
  month: number;
  year: number;
  rows: FormXVIRow[];
}

/* ------------------------------------------------------------------ */
/*  Styles (landscape-specific)                                        */
/* ------------------------------------------------------------------ */

const BORDER = "0.5pt solid #000";
const FONT = 6.5;

const DAY_W = 15;
const COL = {
  serial: 25,
  name: 68,
  father: 60,
  sex: 25,
  day: DAY_W,
  daysTotal: DAY_W * 31,
  total: 32,
  remarks: 100,
};

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    padding: 20,
    color: "#000",
  },
  border: {
    border: "1pt solid #000",
    padding: 10,
    flexGrow: 1,
  },

  centerText: { textAlign: "center", marginBottom: 2 },
  boldCenter: { textAlign: "center", fontFamily: "Helvetica-Bold", marginBottom: 2 },
  legend: { fontSize: 6.5, marginBottom: 6, fontFamily: "Helvetica-Bold" },

  // --- Table ---
  table: { width: "100%" },
  tableRow: { flexDirection: "row" },
  tableHeaderRow: { flexDirection: "row", fontFamily: "Helvetica-Bold" },

  cellSerial: { width: COL.serial, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: FONT, textAlign: "center" },
  cellName: { width: COL.name, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: FONT },
  cellFather: { width: COL.father, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: FONT },
  cellSex: { width: COL.sex, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: FONT, textAlign: "center" },
  cellDay: { width: COL.day, borderRight: BORDER, borderBottom: BORDER, padding: 1, fontSize: FONT, textAlign: "center" },
  cellTotal: { width: COL.total, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: FONT, textAlign: "center" },
  cellRemarks: { width: COL.remarks, borderRight: BORDER, borderBottom: BORDER, padding: 2, fontSize: 5.5 },

  headerDates: { textAlign: "center", fontFamily: "Helvetica-Bold", fontSize: FONT, borderBottom: BORDER, padding: 2 },
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  data: FormXVIData;
}

export function FormXVIPDF({ data }: Props) {
  const { location, employer, month, year, rows } = data;
  const dayNumbers = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.border}>
          {/* ---- Header ---- */}
          <PDFFormHeader
            formNumber=""
            title="FORM XVI"
            ruleRef=""
          />
          <Text style={s.boldCenter}>[See rule 78 (2) (a)]</Text>
          <Text style={s.boldCenter}>MUSTER ROLL</Text>

          {/* ---- Contractor + Establishment ---- */}
          <View style={{ marginTop: 6 }}>
            <PDFFieldRow
              fields={[
                { label: "Name and Address of Contractor:", value: "", flex: 1 },
                { label: "Name and Address of Establishment in/ under which Contract is carried on:", value: employer, flex: 1 },
              ]}
            />
            <PDFContractorBlock label="" />
          </View>

          <PDFFieldRow
            fields={[
              { label: "Name and Location of work:", value: location, flex: 1 },
              { label: "Name and Address of Principal Employer:", value: employer, flex: 1 },
            ]}
          />

          <Text style={s.centerText}>
            For the Month of {formatMonthYear(month, year)}
          </Text>

          {/* ---- Legend ---- */}
          <Text style={s.legend}>
            P : Present, A : Absent, HD : Half Day, O: OFF, NH: National Holiday, EL: Earned Leave, CL: Casual Leave, FL: Festival Leave
          </Text>

          {/* ---- Table ---- */}
          <View style={[s.table, { borderTop: BORDER, borderLeft: BORDER }]}>
            {/* "DATES" spanning header */}
            <View style={s.tableHeaderRow}>
              <View style={[s.cellSerial, { borderBottom: "none" }]} />
              <View style={[s.cellName, { borderBottom: "none" }]} />
              <View style={[s.cellFather, { borderBottom: "none" }]} />
              <View style={[s.cellSex, { borderBottom: "none" }]} />
              <View style={{ width: COL.daysTotal, borderRight: BORDER }}>
                <Text style={s.headerDates}>DATES</Text>
              </View>
              <View style={[s.cellTotal, { borderBottom: "none" }]} />
              <View style={[s.cellRemarks, { borderBottom: "none" }]} />
            </View>

            {/* Column headers */}
            <View style={s.tableHeaderRow}>
              <Text style={s.cellSerial}>Serial{"\n"}No.</Text>
              <Text style={s.cellName}>Name of Worker</Text>
              <Text style={s.cellFather}>Father Name</Text>
              <Text style={s.cellSex}>Sex</Text>
              {dayNumbers.map((d) => (
                <Text key={d} style={s.cellDay}>{d}</Text>
              ))}
              <Text style={s.cellTotal}>Total{"\n"}Attendance</Text>
              <Text style={s.cellRemarks}>Remarks</Text>
            </View>

            {/* Data rows */}
            {rows.map((row) => (
              <View key={row.serialNo} style={s.tableRow} wrap={false}>
                <Text style={s.cellSerial}>{row.serialNo}</Text>
                <Text style={s.cellName}>{row.name}</Text>
                <Text style={s.cellFather}>{row.fatherName}</Text>
                <Text style={s.cellSex}>{row.sex}</Text>
                {dayNumbers.map((d) => (
                  <Text key={d} style={s.cellDay}>{row.days[d - 1] ?? ""}</Text>
                ))}
                <Text style={s.cellTotal}>{row.totalAttendance}</Text>
                <Text style={s.cellRemarks}>{row.remarks}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
