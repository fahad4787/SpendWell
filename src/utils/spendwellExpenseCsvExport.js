/**
 * Export Sales Portal expenses as Mercury-style CSV for FinHub Import Expenses.
 * FinHub: parseMercuryExpenseCsv (Description, Amount, Date (UTC)|Timestamp).
 */

/** Mercury CSV headers (same order as bank export). */
export const FINHUB_MERCURY_EXPENSE_HEADERS = [
  "Date (UTC)",
  "Description",
  "Amount",
  "Status",
  "Source Account",
  "Bank Description",
  "Reference",
  "Note",
  "Last Four Digits",
  "Name On Card",
  "Category",
  "GL Code",
  "Timestamp",
  "Original Currency",
];

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** YYYY-MM-DD → MM-DD-YYYY (Mercury / FinHub). */
export function toMercuryDate(ymd) {
  const raw = String(ymd || "").trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[2]}-${m[3]}-${m[1]}`;
  return raw;
}

/** YYYY-MM-DD → MM-DD-YYYY HH:mm:ss */
export function toMercuryTimestamp(ymd) {
  const datePart = toMercuryDate(ymd);
  if (!datePart) return "";
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(datePart)) {
    return `${datePart} 00:00:00`;
  }
  return datePart;
}

function sourceAccount(row) {
  if (row?.cashTransactionId || row?.paymentSource === "cash") return "Cash";
  if (row?.paymentSource === "bank") return "Bank";
  return "Sales Portal";
}

/**
 * Description helps FinHub auto-detect expense type (keywords in name).
 * Prefer "Category — Description" when both exist.
 */
export function buildExpenseDescription(row) {
  const description = String(row?.description || "").trim();
  const category = String(row?.category || "").trim();
  if (category && description && category !== description) {
    return `${category} — ${description}`;
  }
  return description || category || "Expense";
}

/** Map one Sales Portal expense → Mercury CSV cells. */
export function expenseToMercuryRow(row) {
  const dateYmd = String(row?.date || "").trim();
  const mercuryDate = toMercuryDate(dateYmd);
  const amount = Math.abs(Number(row?.amount));
  const category = String(row?.category || "").trim();
  const description = buildExpenseDescription(row);

  return [
    mercuryDate,
    description,
    Number.isFinite(amount) && amount > 0 ? `-${amount}` : "",
    "Sent",
    sourceAccount(row),
    category,
    String(row?.id || "").trim(),
    category,
    "",
    "",
    category,
    "",
    toMercuryTimestamp(dateYmd),
    "",
  ];
}

/**
 * Build Mercury-compatible CSV text from expense rows.
 * @param {object[]} expenses
 * @returns {string}
 */
export function buildSpendwellExpenseCsv(expenses = []) {
  const rows = (Array.isArray(expenses) ? expenses : [])
    .filter((row) => {
      const amount = Math.abs(Number(row?.amount));
      const date = String(row?.date || "").trim();
      return date && Number.isFinite(amount) && amount > 0;
    })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const lines = [
    FINHUB_MERCURY_EXPENSE_HEADERS.map(csvEscape).join(","),
    ...rows.map((row) => expenseToMercuryRow(row).map(csvEscape).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function spendwellExpenseCsvFilename(rangeStart, rangeEnd) {
  const start = String(rangeStart || "").slice(0, 10) || "start";
  const end = String(rangeEnd || "").slice(0, 10) || "end";
  return `spendwell-expenses-${start}-to-${end}.csv`;
}

/** @deprecated alias */
export const buildFinhubExpenseCsv = buildSpendwellExpenseCsv;
/** @deprecated alias */
export const finhubExpenseCsvFilename = spendwellExpenseCsvFilename;

/** Trigger browser download of CSV text. */
export function downloadCsvFile(filename, csvText) {
  const blob = new Blob([`\uFEFF${csvText}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
