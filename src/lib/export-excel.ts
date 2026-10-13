/**
 * SPD Logistics — Universal Excel & CSV Export Utility
 * Generates structured, UTF-8 BOM encoded CSV files that open natively in Microsoft Excel
 * with full support for Urdu, Arabic, and English text, proper numeric columns, and dates.
 */

export interface ExportColumn<T = any> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToExcel<T = any>(baseFilename: string, columns: ExportColumn<T>[], data: T[]): boolean;
export function exportToExcel<T = any>(data: T[], baseFilename: string, columns?: ExportColumn<T>[]): boolean;
export function exportToExcel<T = any>(
  arg1: string | T[],
  arg2?: ExportColumn<T>[] | string,
  arg3?: T[]
): boolean {
  let baseFilename: string;
  let columns: ExportColumn<T>[];
  let data: T[];

  if (typeof arg1 === "string") {
    // Signature: exportToExcel(filename, columns, data)
    baseFilename = arg1;
    columns = (arg2 as ExportColumn<T>[]) || [];
    data = arg3 || [];
  } else {
    // Signature: exportToExcel(data, filename, optionalColumns)
    data = arg1 || [];
    baseFilename = typeof arg2 === "string" ? arg2 : "Export";
    if (arg3 && Array.isArray(arg3)) {
      columns = arg3 as unknown as ExportColumn<T>[];
    } else if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      columns = Object.keys(data[0]).map((key) => ({
        header: key,
        accessor: (item: any) => item[key],
      }));
    } else {
      columns = [];
    }
  }

  if (!data || data.length === 0) {
    if (typeof window !== "undefined") {
      alert("No records available to export.");
    }
    return false;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const sanitizedBase = (baseFilename || "Export").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fullFilename = `${sanitizedBase}_${todayStr}.csv`;

  const escapeField = (val: any): string => {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    // Wrap in quotes if it contains commas, quotes, or newlines
    if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    // If it's a numeric string that might lose leading zeroes or needs standard quoting
    if (/^[0-9+-\s]+$/.test(str) && str.length > 10) {
      return `="${str}"`; // Excel text formula to preserve phone numbers / CNICs
    }
    return `"${str}"`;
  };

  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");
  const dataRows = data.map((item) =>
    columns.map((col) => escapeField(col.accessor(item))).join(",")
  );

  // UTF-8 BOM (\uFEFF) instructs Excel to open file with UTF-8 encoding
  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fullFilename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
