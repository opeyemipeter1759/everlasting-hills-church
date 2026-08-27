"use client";

/**
 * Downloads an array of rows as a CSV file.
 *
 * Every analytics chart shipped with a CSV button wired to `() => {}` — a
 * control that looked like a feature and did nothing when clicked. The data is
 * already in the browser by the time the chart renders, so exporting it is a
 * matter of formatting, not fetching.
 */
type Cell = string | number | boolean | null | undefined;

/**
 * RFC 4180 quoting. A value is wrapped when it contains a comma, a quote or a
 * newline, and inner quotes are doubled — church data carries service names like
 * `Sunday Service, 16 Aug 2026`, which would otherwise split into two columns.
 */
function cell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// `T extends object` rather than Record<string, Cell>: the chart payloads are
// interfaces, and an interface has no index signature, so it never satisfies a
// Record constraint however plain its fields are.
export function toCsv<T extends object>(
  rows: T[],
  columns?: { key: keyof T; header: string }[],
): string {
  if (rows.length === 0) return "";
  const cols =
    columns ?? (Object.keys(rows[0]) as (keyof T)[]).map((key) => ({ key, header: String(key) }));
  const head = cols.map((c) => cell(c.header)).join(",");
  const body = rows.map((row) =>
    cols.map((c) => cell((row as Record<string, Cell>)[String(c.key)])).join(","),
  );
  return [head, ...body].join("\r\n");
}

/** Slugs a chart title into a filename, dated so repeat exports do not collide. */
function filenameFor(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
}

export function downloadCsv<T extends object>(
  title: string,
  rows: T[],
  columns?: { key: keyof T; header: string }[],
): void {
  const csv = toCsv(rows, columns);
  if (!csv) return;

  // The BOM is what makes Excel read UTF-8 rather than the system codepage —
  // without it a name like "Adébáyọ̀" arrives mangled.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filenameFor(title);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
