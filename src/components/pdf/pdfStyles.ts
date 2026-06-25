import { StyleSheet } from "@react-pdf/renderer";

const BORDER_COLOR = "#000000";
const FONT_SIZE = 10;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_HEADER = 11;

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: FONT_SIZE,
    padding: 30,
    color: "#000",
  },
  pageBorder: {
    border: `1pt solid ${BORDER_COLOR}`,
    padding: 16,
    flexGrow: 1,
  },

  // --- Header row (three-column: form number | title | rule ref) ---
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZE_HEADER,
    fontFamily: "Helvetica-Bold",
  },
  headerRight: {
    flex: 1,
    textAlign: "right",
    fontSize: FONT_SIZE_SMALL,
  },

  // --- Generic rows ---
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  // --- Label / value pairs ---
  label: {
    fontSize: FONT_SIZE,
  },
  value: {
    fontSize: FONT_SIZE,
    fontFamily: "Helvetica-Bold",
  },

  // --- Section (bordered box) ---
  section: {
    borderTop: `1pt solid ${BORDER_COLOR}`,
    paddingTop: 6,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: FONT_SIZE,
    marginBottom: 4,
  },

  // --- Signature ---
  signatureLine: {
    marginTop: 24,
    fontSize: FONT_SIZE,
  },

  // --- Utility ---
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  small: {
    fontSize: FONT_SIZE_SMALL,
  },
  textRight: {
    textAlign: "right",
  },
  mb4: { marginBottom: 4 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  flex1: { flex: 1 },

  // --- PF Report table (blue-grey header, alternating rows) ---
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#6b7b8a",
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: FONT_SIZE_SMALL,
  },
  tableHeaderCell: {
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowAlt: {
    backgroundColor: "#f0f0f0",
  },
  tableCell: {
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    fontSize: FONT_SIZE_SMALL,
  },

  // --- ESIC Report table (header: bold, bordered, subtle grey) ---
  esicTableHeader: {
    flexDirection: "row",
    fontFamily: "Helvetica-Bold",
    fontSize: FONT_SIZE_SMALL,
    backgroundColor: "#e8e8e8",
  },
  esicTableHeaderCell: {
    padding: 5,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  tableCellCenter: {
    textAlign: "center",
  },
});
