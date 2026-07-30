export function convertToCSV(rows) {
  if (!rows || rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);

  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replaceAll('"', '""')}"`;
    }

    return stringValue;
  };

  const headerRow = headers.join(",");

  const dataRows = rows.map((row) => {
    return headers.map((header) => escapeCSVValue(row[header])).join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}