"use client";

import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import clsx from "clsx";

type Trend = { value: number; label?: string }; // positivo=verde, negativo=vermelho

export default function KpiCard({
  title,
  value,
  icon,
  trend,
  caption,
  loading = false,
  error,
  dense = true, // ↓ menor altura por padrão
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: Trend;
  caption?: string; // ex.: "vs último mês" ou "próx. 2 meses"
  loading?: boolean;
  error?: string;
  dense?: boolean;
}) {
  if (loading) {
    return (
      <div
        className={clsx(
          "rounded-2xl border border-gray-200/60 bg-white shadow-sm",
          dense ? "p-4" : "p-5"
        )}
      >
        <div className={clsx("animate-pulse rounded bg-gray-200 mb-2", dense ? "h-3 w-24" : "h-4 w-28")} />
        <div className={clsx("animate-pulse rounded bg-gray-200", dense ? "h-6 w-20" : "h-8 w-24")} />
        <div className={clsx("animate-pulse rounded bg-gray-100 mt-3", dense ? "h-3 w-36" : "h-4 w-40")} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={clsx(
          "rounded-2xl border border-red-200 bg-red-50 shadow-sm",
          dense ? "p-4" : "p-5"
        )}
      >
        <div className={clsx("font-medium text-red-700", dense ? "text-xs" : "text-sm")}>{title}</div>
        <div className={clsx("text-red-700 mt-1.5", dense ? "text-xs" : "text-sm")}>Erro: {error}</div>
      </div>
    );
  }

  const pos = trend && trend.value > 0;
  const neg = trend && trend.value < 0;

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-sm hover:shadow-md transition",
        dense ? "p-4" : "p-5"
      )}
    >
      {/* ícone */}
      {icon && (
        <div
          className={clsx(
            "absolute right-4 top-4 rounded-full bg-gray-100",
            dense ? "p-1" : "p-2"
          )}
        >
          {icon}
        </div>
      )}

      <div className={clsx("text-gray-600", dense ? "text-xs" : "text-sm")}>{title}</div>
      <div
        className={clsx(
          "font-semibold tracking-tight",
          dense ? "mt-0.5 text-2xl" : "mt-1 text-3xl"
        )}
      >
        {value}
      </div>

      {trend ? (
        <div
          className={clsx(
            "inline-flex items-center gap-1 font-medium",
            dense ? "mt-2 text-xs" : "mt-3 text-sm",
            pos && "text-emerald-600",
            neg && "text-red-600",
            trend.value === 0 && "text-gray-500"
          )}
        >
          {pos && <ArrowUpRight className={clsx(dense ? "h-3 w-3" : "h-4 w-4")} />}
          {neg && <ArrowDownRight className={clsx(dense ? "h-3 w-3" : "h-4 w-4")} />}
          <span>
            {Math.abs(trend.value).toFixed(1)}% {caption ?? "vs último mês"}
          </span>
        </div>
      ) : (
        caption && (
          <div className={clsx("text-gray-500", dense ? "mt-2 text-xs" : "mt-3 text-sm")}>
            {caption}
          </div>
        )
      )}
    </div>
  );
}
