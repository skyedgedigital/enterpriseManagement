import { Page, View, Text } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { pdfStyles as s } from "./pdfStyles";
import { CONTRACTOR_NAME, CONTRACTOR_ADDRESS } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  PDFPage                                                            */
/* ------------------------------------------------------------------ */

interface PDFPageProps {
  children: ReactNode;
}

export function PDFPage({ children }: PDFPageProps) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.pageBorder}>{children}</View>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFFormHeader                                                      */
/* ------------------------------------------------------------------ */

interface PDFFormHeaderProps {
  formNumber: string;
  title: string;
  ruleRef?: string;
}

export function PDFFormHeader({ formNumber, title, ruleRef }: PDFFormHeaderProps) {
  return (
    <View style={s.headerRow}>
      <Text style={s.headerLeft}>{formNumber}</Text>
      <Text style={s.headerCenter}>{title}</Text>
      <Text style={s.headerRight}>{ruleRef ?? ""}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFContractorBlock                                                 */
/* ------------------------------------------------------------------ */

interface PDFContractorBlockProps {
  label?: string;
}

export function PDFContractorBlock({
  label = "Name & Address of Contractor :",
}: PDFContractorBlockProps) {
  return (
    <View style={[s.row, s.mb8]}>
      <Text style={s.label}>{label}   </Text>
      <View>
        <Text style={s.value}>{CONTRACTOR_NAME}</Text>
        <Text style={s.value}>{CONTRACTOR_ADDRESS}</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFField  (single label : value pair)                              */
/* ------------------------------------------------------------------ */

interface PDFFieldProps {
  label: string;
  value: string;
  bold?: boolean;
}

export function PDFField({ label, value, bold = true }: PDFFieldProps) {
  return (
    <View style={[s.row, s.mb4]}>
      <Text style={s.label}>{label}   </Text>
      <Text style={bold ? s.value : s.label}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFFieldRow  (multiple label-value pairs in one row)               */
/* ------------------------------------------------------------------ */

interface FieldDef {
  label: string;
  value: string;
  flex?: number;
  bold?: boolean;
}

interface PDFFieldRowProps {
  fields: FieldDef[];
}

export function PDFFieldRow({ fields }: PDFFieldRowProps) {
  return (
    <View style={[s.rowBetween, s.mb4]}>
      {fields.map((f, i) => (
        <View key={i} style={[s.row, { flex: f.flex ?? 1 }]}>
          <Text style={s.label}>{f.label}   </Text>
          <Text style={f.bold !== false ? s.value : s.label}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFSection  (bordered section with optional title)                 */
/* ------------------------------------------------------------------ */

interface PDFSectionProps {
  title?: string;
  children: ReactNode;
}

export function PDFSection({ title, children }: PDFSectionProps) {
  return (
    <View style={s.section}>
      {title && <Text style={s.sectionTitle}>{title}</Text>}
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  PDFSignatureLine                                                   */
/* ------------------------------------------------------------------ */

interface PDFSignatureLineProps {
  text: string;
}

export function PDFSignatureLine({ text }: PDFSignatureLineProps) {
  return <Text style={s.signatureLine}>{text}</Text>;
}

/* ------------------------------------------------------------------ */
/*  PDFNumberedLine  (e.g. "1. No. of Days Worked : 23")              */
/* ------------------------------------------------------------------ */

interface PDFNumberedLineProps {
  number: number;
  label: string;
  children: ReactNode;
}

export function PDFNumberedLine({ number, label, children }: PDFNumberedLineProps) {
  return (
    <View style={[s.row, s.mb4]}>
      <Text style={s.label}>{number}. {label} :   </Text>
      {children}
    </View>
  );
}
