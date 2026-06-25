import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Employee } from "@/types";

export interface CLMEmployeeRow {
  employee: Employee;
  attendanceSummary: number;
  wagesStatus: "filled" | "Not filled";
  attendanceId?: string;
}

export interface CLMEmployeeTableProps {
  rows: CLMEmployeeRow[];
  canRemove?: boolean;
  onEmployeeCodeClick: (code: string) => void;
  onAttendanceClick: (employeeId: string, employeeName: string) => void;
  onWagesClick: (row: CLMEmployeeRow) => void;
  onPaymentShow: (employee: Employee) => void;
  onGenerateWagesPaySlip: (employee: Employee) => void;
  onGenerateWagesPaySlipExcel: (employee: Employee) => void;
  onRemoveEmployee?: (employee: Employee) => void;
}

export function CLMEmployeeTable({
  rows,
  canRemove = false,
  onEmployeeCodeClick,
  onAttendanceClick,
  onWagesClick,
  onPaymentShow,
  onGenerateWagesPaySlip,
  onGenerateWagesPaySlipExcel,
  onRemoveEmployee,
}: CLMEmployeeTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
        Select Year, Month, Work Order and click &quot;Show List&quot; to see employees.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Sl.No.</TableHead>
            <TableHead>Employee Name</TableHead>
            <TableHead>Employee Code</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Wages</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.employee.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{row.employee.name || "-"}</TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onEmployeeCodeClick(row.employee.code)}
                  className="text-primary underline underline-offset-2 hover:no-underline font-medium"
                >
                  {row.employee.code}
                </button>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onAttendanceClick(row.employee.id, row.employee.name || row.employee.code)}
                  className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-medium"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                  {row.attendanceSummary}
                </button>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onWagesClick(row)}
                  className={
                    row.wagesStatus === "Not filled"
                      ? "text-red-600 font-medium underline underline-offset-2 hover:no-underline"
                      : "text-muted-foreground underline underline-offset-2 hover:no-underline"
                  }
                >
                  {row.wagesStatus}
                </button>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                  onClick={() => onPaymentShow(row.employee)}
                >
                  Show
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onGenerateWagesPaySlip(row.employee)}
                    disabled={row.wagesStatus === "Not filled"}
                  >
                    Generate Wages Pay Slip
                  </Button>
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => onGenerateWagesPaySlipExcel(row.employee)}
                    disabled={row.wagesStatus === "Not filled"}
                  >
                    Wages Slip Excel
                  </Button>
                  {canRemove && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveEmployee?.(row.employee)}
                      title="Remove from this work order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
