import { useState, useMemo, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
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
  /** Remote search: skip client filter and always show the search box. */
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  searchLoading?: boolean;
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
  onSearchChange,
  searchValue,
  searchLoading = false,
  onRowClick,
  pageSize = 10,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const remote = onSearchChange != null;
  const inputValue = remote ? (searchValue ?? search) : search;

  const activeSearchKeys = useMemo(() => {
    if (searchKeys && searchKeys.length > 0) return searchKeys;
    if (searchKey !== undefined) return [searchKey];
    return [] as (keyof T)[];
  }, [searchKey, searchKeys]);

  const showSearch = remote || activeSearchKeys.length > 0;

  const filteredData = useMemo(() => {
    if (remote) return data;
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
  }, [data, search, activeSearchKeys, remote]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredData.length / pageSize) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [filteredData.length, pageSize, page]);

  const emptyMessage =
    remote && searchLoading
      ? "Searching…"
      : remote && !inputValue.trim()
        ? "Type to search."
        : "No results found.";

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={inputValue}
            onChange={(e) => {
              const next = e.target.value;
              setSearch(next);
              setPage(0);
              onSearchChange?.(next);
            }}
            className="pl-9 pr-9"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
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
                  {emptyMessage}
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
