import type React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

import { UlpData } from "./data-loader";

export type Tone = "positive" | "negative" | "warning" | "neutral";

export type CommonViewProps = {
  isLoading: boolean;
  data: UlpData[];
};

type KpiStatProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
  icon?: React.ElementType;
};

export function KpiStat({ label, value, helper, tone = "neutral", icon: Icon }: KpiStatProps) {
  const color =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-rose-600"
      : tone === "warning"
      ? "text-amber-600"
      : "text-[#5B6B7F]";

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-4 w-4 ${color}`} />}
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#5B6B7F]">
          {label}
        </p>
      </div>
      <p className="text-base font-semibold text-[#0B1E33] lg:text-lg">
        {value}
      </p>
      {helper && (
        <p className={`text-[11px] leading-tight ${color}`}>{helper}</p>
      )}
    </div>
  );
}

type BarItem = {
  label: string;
  primary: number;
  secondary: number;
};

type BarListPlaceholderProps = {
  title: string;
  items: BarItem[];
};

export function BarListPlaceholder({ title, items }: BarListPlaceholderProps) {
  return (
    <div className="space-y-3 text-xs">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#5B6B7F]">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#5B6B7F]">{item.label}</span>
              <span className="font-medium text-[#0B1E33]">
                {item.primary}%
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-[#E6F3FF]">
              <div
                className="bg-[#0066CC]"
                style={{ width: `${item.secondary}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type MiniStatProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone?: Tone;
};

export function MiniStat({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: MiniStatProps) {
  const color =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
      ? "text-rose-600"
      : tone === "warning"
      ? "text-amber-600"
      : "text-[#5B6B7F]";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#E1ECF7] bg-[#F7FBFF] px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="text-[11px] text-[#5B6B7F]">{label}</span>
        <span className="text-sm font-semibold text-[#0B1E33]">{value}</span>
      </div>
    </div>
  );
}

type AgingRowProps = {
  label: string;
  value: number;
  tone?: Tone;
};

export function AgingRow({ label, value, tone = "neutral" }: AgingRowProps) {
  const color =
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "negative"
      ? "bg-rose-500"
      : tone === "warning"
      ? "bg-amber-500"
      : "bg-[#0066CC]";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[#5B6B7F]">{label}</span>
        <span className="font-medium text-[#0B1E33]">{value}%</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[#E6F3FF]">
        <div className={`${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

type ChartPlaceholderProps = {
  variant?: "area" | "donut" | "bars";
};

export function ChartPlaceholder({ variant = "area" }: ChartPlaceholderProps) {
  if (variant === "donut") {
    return <DonutPlaceholder value={72} />;
  }
  if (variant === "bars") {
    return (
      <div className="flex h-28 items-end gap-1 rounded-xl bg-[#F7FBFF] p-3">
        {[28, 46, 64, 40, 72, 55, 62].map((height, index) => (
          <div
            key={index}
            className="flex-1 rounded-full bg-gradient-to-t from-[#B3D7FF] to-[#0066CC]"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="relative h-40 overflow-hidden rounded-xl bg-gradient-to-b from-[#0066CC] to-[#0B1E33]">
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[radial-gradient(circle_at_0_0,#ffffff_0,transparent_60%),radial-gradient(circle_at_100%_100%,#ffffff_0,transparent_60%)]" />
      </div>
      <div className="relative flex h-full items-end gap-2 px-4 pb-3">
        {[20, 60, 35, 90, 45, 80, 55, 110, 70].map((value, index) => (
          <div
            key={index}
            className="flex-1 rounded-full bg-gradient-to-t from-white/10 to-white"
            style={{ height: `${20 + value / 2}%` }}
          />
        ))}
      </div>
    </div>
  );
}

type DonutPlaceholderProps = {
  value: number;
};

export function DonutPlaceholder({ value }: DonutPlaceholderProps) {
  const strokeDasharray = 283;
  const strokeDashoffset = strokeDasharray - (strokeDasharray * value) / 100;

  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          className="text-[#E6F3FF]"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className="text-[#0066CC]"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          style={{
            strokeDasharray,
            strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white">
        <div className="text-center">
          <p className="text-xs font-semibold text-[#0B1E33]">{value}%</p>
          <p className="text-[10px] text-[#5B6B7F]">Coverage</p>
        </div>
      </div>
    </div>
  );
}

export type CsvRow = Record<string, string | number | null | undefined>;

export function downloadCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length) {
    return;
  }

  const headers = Object.keys(rows[0]);

  const toCsvValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    if (
      stringValue.includes('"') ||
      stringValue.includes(",") ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => toCsvValue(row[header])).join(","),
    ),
  ];

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type DataModalProps = {
  title: string;
  description?: string;
  headers: string[];
  rows: (string | number)[][];
  onClose: () => void;
  onExport: () => void;
  exportLabel: string;
};

export function DataModal({
  title,
  description,
  headers,
  rows,
  onClose,
  onExport,
  exportLabel,
}: DataModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[#E1ECF7] px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold text-[#0B1E33]">{title}</p>
            {description && (
              <p className="text-xs text-[#5B6B7F]">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="mr-1 h-3 w-3" />
              {exportLabel}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#5B6B7F] hover:bg-[#E6F3FF]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-auto px-4 py-3">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E1ECF7] bg-[#F7FBFF]">
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-2 py-1 text-left font-medium text-[#5B6B7F]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#F9FBFF]"}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-2 py-1 text-[11px] text-[#0B1E33]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-2 py-4 text-center text-[11px] text-[#5B6B7F]"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
