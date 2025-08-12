import React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";

export interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
}

// Komponen icon sorting dengan SVG dan Tailwind
const SortIcon = ({
  direction,
}: {
  direction: "asc" | "desc" | "none";
}) => {
  if (direction === "asc") {
    return (
      <svg
        className="inline-block w-6 h-6  ml-1 text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 12l5-5 5 5H5z" />
      </svg>
    );
  }
  if (direction === "desc") {
    return (
      <svg
        className="inline-block w-6 h-6  ml-1 text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M15 8l-5 5-5-5h10z" />
      </svg>
    );
  }
  // none (belum di-sort)
  return (
    <svg
      className="inline-block w-6 h-6  ml-1 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6-6 6 6" />
      <path d="M6 15l6 6 6-6" />
    </svg>
  );
};

function DataTable<T extends object>({ columns, data }: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Global Search Input */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-center">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={`border p-2 text-sm font-semibold select-none ${
                      header.column.getCanSort() ? "cursor-pointer" : ""
                    }`}
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getCanSort() && (
                      <SortIcon
                        direction={
                          (header.column.getIsSorted() as
                            | "asc"
                            | "desc"
                            | false) || "none"
                        }
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border p-2 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center p-4 text-gray-500"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-2 py-8">
        <button
          className="border px-2 py-1 rounded disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </button>
        <span>
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          className="border px-2 py-1 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="border p-1 rounded ml-4"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default DataTable;
