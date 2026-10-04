import { Text, View } from '@react-pdf/renderer';
import { reportText, reportTotals, type ReportColumn } from '@/lib/reportPolicy';

/** Column order and widths match the report's physical table columns. */
export function ReportTotalsRow<T>({ rows, columns, widths, labelColumn = 1 }: {
  rows: readonly T[]; columns: readonly ReportColumn[]; widths: (number | `${string}%`)[]; labelColumn?: number;
}) {
  const totals = reportTotals(rows, columns);
  return <View wrap={false} style={{ flexDirection: 'row', backgroundColor: '#eeeeee', fontFamily: 'Helvetica-Bold', borderBottomWidth: 0.5 }}>
    {columns.map((column, i) => <Text key={`${column.key}-${i}`} style={{ width: widths[i], padding: 2, borderRightWidth: i === columns.length - 1 ? 0 : 0.5, textAlign: i === labelColumn ? 'left' : 'right' }}>
      {i === labelColumn ? 'Total' : column.key in totals ? reportText(totals[column.key], column.kind) : ''}
    </Text>)}
  </View>;
}
