import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Search a single column; ignored if searchKeys is provided. */
  searchKey?: keyof T;
  /** Search any of these string columns (substring match). */
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  pageSize?: number;
  actions?: (item: T) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKey,
  searchKeys,
  searchPlaceholder = "Search...",
  onRowClick,
  pageSize = 10,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const activeSearchKeys = useMemo(() => {
    if (searchKeys && searchKeys.length > 0) return searchKeys;
    if (searchKey !== undefined) return [searchKey];
    return [] as (keyof T)[];
  }, [searchKey, searchKeys]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || activeSearchKeys.length === 0) return data;
    return data.filter((item) =>
      activeSearchKeys.some((key) => {
        const value = item[key];
        return (
          typeof value === "string" &&
          value.toLowerCase().includes(q)
        );
      }),
    );
  }, [data, search, activeSearchKeys]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  return (
    <div className="space-y-4">
      {activeSearchKeys.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>
      )}

      {/* Table with horizontal scroll on mobile */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={`whitespace-nowrap ${col.className ?? ""}`}>
                  {col.header}
                </TableHead>
              ))}
              {actions && <TableHead className="w-[100px] sticky right-0 bg-background">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/50"}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={`whitespace-nowrap ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(item)
                        : String((item as Record<string, unknown>)[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="sticky right-0 bg-background">
                      <div className="flex items-center gap-1">
                        {actions(item)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1}-
            {Math.min((page + 1) * pageSize, filteredData.length)} of{" "}
            {filteredData.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
