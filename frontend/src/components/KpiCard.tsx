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
}: {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: Trend;
  caption?: string;         // ex.: "vs último mês" ou "próx. 2 meses"
  loading?: boolean;
  error?: string;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 mb-3" />
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-40 animate-pulse rounded bg-gray-100 mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="text-sm font-medium text-red-700">{title}</div>
        <div className="mt-2 text-red-700">Erro: {error}</div>
      </div>
    );
  }

  const pos = trend && trend.value > 0;
  const neg = trend && trend.value < 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-white p-5 shadow-sm hover:shadow-md transition">
      {/* ícone */}
      {icon && (
        <div className="absolute right-4 top-4 rounded-full bg-gray-100 p-2">
          {icon}
        </div>
      )}
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>

      {trend ? (
        <div
          className={clsx(
            "mt-3 inline-flex items-center gap-1 text-sm font-medium",
            pos && "text-emerald-600",
            neg && "text-red-600",
            trend.value === 0 && "text-gray-500"
          )}
        >
          {pos && <ArrowUpRight className="h-4 w-4" />}
          {neg && <ArrowDownRight className="h-4 w-4" />}
          <span>
            {Math.abs(trend.value).toFixed(1)}% {caption ?? "vs último mês"}
          </span>
        </div>
      ) : (
        caption && <div className="mt-3 text-sm text-gray-500">{caption}</div>
      )}
    </div>
  );
}