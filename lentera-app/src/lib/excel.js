const pad = (value) => String(value).padStart(2, '0');

export const excelFileName = (label) => {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `lentera_${label}_${date}_${time}.xlsx`;
};

export const dateCell = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const sanitizeSheetName = (name) =>
  String(name || 'Data').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Data';

const readCell = (column, row) => {
  const raw = typeof column.value === 'function' ? column.value(row) : row[column.key];
  if (raw === null || raw === undefined) return '';
  return raw;
};

export async function exportRowsToExcel({ fileName, sheetName = 'Data', columns = [], rows = [] }) {
  if (columns.length === 0) return false;

  const module = await import('xlsx');
  const XLSX = module.default ?? module;
  const header = columns.map((column) => column.header);
  const body = rows.map((row) => columns.map((column) => readCell(column, row)));
  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);

  sheet['!cols'] = columns.map((column, index) => {
    let width = String(header[index]).length;
    body.forEach((line) => {
      width = Math.max(width, String(line[index] ?? '').length);
    });
    return { wch: Math.min(column.maxWidth ?? 42, Math.max(column.minWidth ?? 10, width + 2)) };
  });

  if (body.length > 0) {
    sheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: body.length, c: columns.length - 1 } }),
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sanitizeSheetName(sheetName));
  XLSX.writeFile(workbook, fileName);
  return true;
}
