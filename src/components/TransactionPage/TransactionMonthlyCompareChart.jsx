import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { THEME } from "../../theme/colors";

const formatAxisCompact = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
};

const TransactionMonthlyCompareChart = ({ data, categoryFilter }) => {
  if (!data?.length) return null;
  const hasValue = data.some((d) => Number(d.income) > 0 || Number(d.expense) > 0);
  if (!hasValue) return null;
  return (
    <div className="transaction-monthly-chart card border-0 shadow-sm mb-3">
      <div className="transaction-monthly-chart-head px-3 py-2 border-bottom d-flex flex-column flex-sm-row flex-wrap gap-1 align-items-sm-center justify-content-between">
        <span className="fw-semibold text-secondary small text-uppercase" style={{ letterSpacing: "0.04em" }}>
          Income vs expenses by month
        </span>
        {categoryFilter ? (
          <span className="small text-muted fw-semibold">
            Category: <span className="text-dark">{categoryFilter}</span>
          </span>
        ) : null}
      </div>
      <div className="transaction-monthly-chart-body p-3">
        <ResponsiveContainer width="100%" height={320} debounce={50}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 8 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceff3" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval={0}
              angle={data.length > 8 ? -35 : 0}
              textAnchor={data.length > 8 ? "end" : "middle"}
              height={data.length > 8 ? 52 : 28}
            />
            <YAxis
              tickFormatter={formatAxisCompact}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) =>
                Number(value).toLocaleString("en-US", {
                  style: "currency",
                  currency: "PKR",
                  maximumFractionDigits: 0,
                })
              }
              contentStyle={{
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="income" name="Income" fill={THEME.primary} radius={[4, 4, 0, 0]} maxBarSize={56} />
            <Bar dataKey="expense" name="Expenses" fill={THEME.danger} radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TransactionMonthlyCompareChart;
