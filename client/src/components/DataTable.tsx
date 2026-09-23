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

export interface DataTableProps<TData> {
  columns: (ColumnDef<TData> & { size?: number })[];
  data: TData[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
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
        className="inline-block w-6 h-6 ml-1 text-blue-600"
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
        className="inline-block w-6 h-6 ml-1 text-blue-600"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M15 8l-5 5-5-5h10z" />
      </svg>
    );
  }

  return (
    <svg
      className="inline-block w-6 h-6 ml-1 text-gray-400"
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

function DataTable<TData extends object>({
  columns,
  data,
  globalFilter: globalFilterProp,
  setGlobalFilter: setGlobalFilterProp,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Gunakan state internal hanya jika prop tidak diberikan
  const [internalGlobalFilter, setInternalGlobalFilter] =
    React.useState<string>("");

  // Gunakan globalFilter dari prop jika ada, jika tidak gunakan state internal
  const globalFilterValue =
    globalFilterProp !== undefined
      ? globalFilterProp
      : internalGlobalFilter;

  const setGlobalFilterValue =
    setGlobalFilterProp !== undefined
      ? setGlobalFilterProp
      : setInternalGlobalFilter;

  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [pageInput, setPageInput] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: globalFilterValue,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilterValue,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handlePageInput = (value: string) => {
    setPageInput(value);

    const page = Number(value);
    const pageCount = table.getPageCount();

    if (
      Number.isInteger(page) &&
      page >= 1 &&
      page <= pageCount
    ) {
      table.setPageIndex(page - 1);
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* Global Search Input */}
      <div className="mb-4 w-full">
        <input
          type="text"
          placeholder="Search..."
          value={globalFilterValue ?? ""}
          onChange={(e) => setGlobalFilterValue(e.target.value)}
          className="w-full max-w-xl border border-gray-300 px-3 py-2 rounded text-sm"
        />
      </div>

      <div className="w-full min-w-0 overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-center table-fixed">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={`border border-gray-300 p-2 text-sm font-semibold select-none ${
                      header.column.getCanSort() ? "cursor-pointer" : ""
                    }`}
                    style={{
                      width: (
                        header.column.columnDef as ColumnDef<TData> & {
                          size?: number;
                        }
                      ).size
                        ? `${
                            (
                              header.column.columnDef as ColumnDef<TData> & {
                                size?: number;
                              }
                            ).size
                          }px`
                        : "auto",
                    }}
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
                    <td
                      key={cell.id}
                      className="border border-gray-300 p-2 text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
      <div className="flex flex-wrap items-center justify-center gap-2 py-8">
        <button
          className="border border-gray-300 px-2 py-1 rounded disabled:opacity-50"
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
          className="border border-gray-300 px-2 py-1 rounded disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>

        <div className="flex items-center gap-2 ml-2">
          <label htmlFor="page-input" className="text-sm">
            Go to
          </label>

          <input
            id="page-input"
            type="number"
            min={1}
            max={Math.max(table.getPageCount(), 1)}
            value={pageInput}
            onChange={(e) => handlePageInput(e.target.value)}
            placeholder={String(
              table.getState().pagination.pageIndex + 1
            )}
            className="w-20 border border-gray-300 px-2 py-1 rounded"
          />
        </div>

        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          className="border border-gray-300 p-1 rounded ml-2"
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