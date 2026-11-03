import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col } from "react-bootstrap";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { RiArrowUpLine, RiArrowDownLine, RiPieChartLine, RiBarChart2Line, RiFileList3Line } from "react-icons/ri";
import CategoryTransactionModal from "./CategoryTransactionModal";
import AppLoader from "../ui/AppLoader";

const INCOME_COLORS = [
  "#171717",
  "#4D7C0F",
  "#6B6B66",
  "#3F3F3A",
  "#A6DE3A",
  "#9A9A94",
  "#5C7A1F",
  "#2A2A2A",
];

const EXPENSE_COLORS = [
  "#DC2626",
  "#B91C1C",
  "#F43F5E",
  "#9F1239",
  "#6B6B66",
  "#3F3F3A",
  "#171717",
  "#9A9A94",
];

const SUMMARY_CATEGORY_CHART_PLOT_HEIGHT = 320;

const truncateChartLabel = (str, max = 22) => {
  const s = str == null ? '' : String(str);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
};

const formatCompactPk = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(Math.round(n));
};

const JULY_2025 = '2025-07';
const JULY_START_BALANCE = 57010;

// Helper functions
const isSameMonth = (dateStr, selectedMonth) => {
  const d = new Date(dateStr);
  const [year, month] = selectedMonth.split('-').map(Number);
  return d.getFullYear() === year && (d.getMonth() + 1) === month;
};

const isBeforeMonth = (dateStr, monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(dateStr);
  const itemYear = d.getFullYear();
  const itemMonth = d.getMonth() + 1;
  return itemYear < year || (itemYear === year && itemMonth < month);
};

const getPreviousMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
};

const calculateMonthTotals = (transactions) => {
  return transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
};

const isPnlExpense = (item) => item.paymentSource !== "cash";

const SummaryIcons = {
  arrowUp: RiArrowUpLine,
  arrowDown: RiArrowDownLine,
  pie: RiPieChartLine,
  bars: RiBarChart2Line,
  list: RiFileList3Line,
};

const SummaryEmptyState = ({ icon: IconComponent, title, message }) => (
  <div className="summary-empty">
    <span className="summary-empty__icon" aria-hidden="true">
      {IconComponent ? <IconComponent /> : null}
    </span>
    <p className="summary-empty__title">{title}</p>
    <p className="summary-empty__message">{message}</p>
  </div>
);

const StatCard = ({
  className,
  label,
  value,
  valueClassName,
  suffix,
  index = 0,
}) => {
  return (
    <Col>
      <Card
        className={`summary-card ${className} text-center h-100`}
        style={{ "--kpi-i": index }}
      >
        <Card.Body className="d-flex flex-column justify-content-center summary-card__body">
          <span className="summary-card__glow" aria-hidden="true" />
          <h6 className="summary-card__label mb-2">{label}</h6>
          <h3 className={`mb-0 fw-bold summary-kpi__value ${valueClassName}`}>{value}</h3>
          <small className="summary-card__suffix">{suffix}</small>
        </Card.Body>
      </Card>
    </Col>
  );
};

const CategoryExpenseBarChartCard = ({
  data,
  colors,
  Icon: IconComponent,
  headerTitle,
  onCategoryClick,
  totalForPercent,
}) => {
  const sorted = useMemo(
    () => [...data].sort((a, b) => Number(b.value) - Number(a.value)),
    [data]
  );
  const hasData = sorted.length > 0;
  const chartHeight = hasData
    ? Math.min(560, Math.max(280, sorted.length * 40 + 64))
    : SUMMARY_CATEGORY_CHART_PLOT_HEIGHT;

  return (
    <Col md={6} className="d-flex">
      <Card className="summary-panel-card summary-chart-card expense-chart-card h-100 w-100 d-flex flex-column">
        <Card.Header className="summary-panel-header summary-panel-header--expense d-flex align-items-center">
          <div className="summary-panel-header-icon me-3" aria-hidden>
            {IconComponent ? <IconComponent /> : null}
          </div>
          <h5 className="mb-0 fw-bold">{headerTitle}</h5>
        </Card.Header>
        <Card.Body className="summary-panel-body summary-panel-body--chart chart-body--expense-bar d-flex flex-column flex-grow-1">
          {!hasData ? (
            <SummaryEmptyState
              icon={SummaryIcons.bars}
              title="No expense categories"
              message="Import or add expenses in this range to see the breakdown."
            />
          ) : (
            <div className="summary-category-chart-plot summary-expense-bar-scroll">
              <div style={{ height: chartHeight, minHeight: SUMMARY_CATEGORY_CHART_PLOT_HEIGHT }}>
                <ResponsiveContainer width="100%" height={chartHeight} debounce={48}>
                  <BarChart
                    layout="vertical"
                    data={sorted}
                    margin={{ top: 8, right: 18, left: 4, bottom: 8 }}
                    barCategoryGap="18%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ecece6" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatCompactPk}
                      fontSize={11}
                      tick={{ fill: "#6b6b66" }}
                      axisLine={{ stroke: "#e4e4de" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      reversed
                      tick={{ fontSize: 11, fill: "#171717" }}
                      tickFormatter={truncateChartLabel}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => {
                        const n = Number(value);
                        const pct =
                          totalForPercent > 0
                            ? ((n / totalForPercent) * 100).toFixed(1)
                            : "0";
                        const amt = n.toLocaleString("en-US", {
                          style: "currency",
                          currency: "PKR",
                          maximumFractionDigits: 0,
                        });
                        return [`${amt} (${pct}%)`, "Amount"];
                      }}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e4e4de",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(23,23,23,0.08)",
                        padding: "12px 14px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
                      {sorted.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={colors[index % colors.length]}
                          style={{ cursor: onCategoryClick ? "pointer" : "default" }}
                          onClick={() => onCategoryClick?.(entry.name, "expense")}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

const CategoryPieChartCard = ({
  data,
  colors,
  Icon: IconComponent,
  headerTitle,
}) => {
  const hasData = data.length > 0;

  return (
    <Col md={6} className="d-flex">
      <Card className="summary-panel-card summary-chart-card income-chart-card h-100 w-100 d-flex flex-column">
        <Card.Header className="summary-panel-header summary-panel-header--income d-flex align-items-center">
          <div className="summary-panel-header-icon me-3" aria-hidden>
            {IconComponent ? <IconComponent /> : null}
          </div>
          <h5 className="mb-0 fw-bold">{headerTitle}</h5>
        </Card.Header>
        <Card.Body className="summary-panel-body summary-panel-body--chart d-flex flex-column flex-grow-1">
          {!hasData ? (
            <SummaryEmptyState
              icon={SummaryIcons.pie}
              title="No income categories"
              message="Add income in this range to see the category split."
            />
          ) : (
            <div className="summary-category-chart-plot">
              <ResponsiveContainer width="100%" height={SUMMARY_CATEGORY_CHART_PLOT_HEIGHT}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="46%"
                    labelLine={false}
                    outerRadius={108}
                    innerRadius={58}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      Number(value).toLocaleString("en-US", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0,
                      })
                    }
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4de",
                      borderRadius: "12px",
                      boxShadow: "0 8px 24px rgba(23,23,23,0.08)",
                      padding: "12px 14px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={48}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "12px", color: "#171717" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

const CategorySummaryPagele = ({
  data,
  total,
  type,
  onRowClick,
  title,
  valueClassName,
  sign,
}) => {
  const HeaderIcon = type === "income" ? SummaryIcons.arrowUp : SummaryIcons.arrowDown;
  const tone = type === "income" ? "income" : "expense";
  const hasData = data.length > 0;

  return (
    <Col md={6} className="d-flex">
      <Card className={`summary-panel-card summary-table-card summary-table-card--${tone} h-100 w-100 d-flex flex-column`}>
        <Card.Header className={`summary-panel-header summary-panel-header--${tone} d-flex align-items-center`}>
          <div className="summary-panel-header-icon me-3" aria-hidden>
            <HeaderIcon />
          </div>
          <h5 className="mb-0 fw-bold">{title}</h5>
        </Card.Header>
        <Card.Body className="summary-panel-body d-flex flex-column flex-grow-1">
          {!hasData ? (
            <SummaryEmptyState
              icon={SummaryIcons.list}
              title={type === "income" ? "No income yet" : "No expenses yet"}
              message={`Nothing to summarize for this ${type} range.`}
            />
          ) : (
            <div className="app-data-table-wrap mt-2 flex-grow-1">
              <table className="app-data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr
                      key={index}
                      className="cursor-pointer"
                      onClick={() => onRowClick(item.name, type)}
                    >
                      <td>{item.name}</td>
                      <td className={valueClassName}>
                        {sign}
                        {item.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="summary-table-total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className={valueClassName}>
                      <strong>
                        {sign}
                        {total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

const isDateInRange = (dateStr, rangeStart, rangeEnd) => {
  if (!dateStr || !rangeStart || !rangeEnd) return false;
  const d = String(dateStr).slice(0, 10);
  return d >= rangeStart && d <= rangeEnd;
};

const SummaryPage = ({ rangeStart, rangeEnd, refreshKey, onHasData }) => {
  const referenceMonth = rangeStart ? rangeStart.slice(0, 7) : "";
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    startBalance: 0
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart, rangeEnd, refreshKey]);

  useEffect(() => {
    if (onHasData) {
      onHasData(incomeData.length > 0 || expenseData.length > 0);
    }
  }, [incomeData, expenseData, onHasData]);

  const fetchData = async () => {
    if (!rangeStart || !rangeEnd) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Fetch all income and expenses in parallel
      const [incomeSnapshot, expenseSnapshot, cashMonthSnap] = await Promise.all([
        getDocs(query(collection(db, "income"), orderBy("date", "desc"))),
        getDocs(query(collection(db, "expenses"), orderBy("date", "desc"))),
        getDocs(query(
          collection(db, "cash_transactions"),
          where("date", ">=", rangeStart),
          where("date", "<=", rangeEnd)
        ))
      ]);

      const allIncomeData = incomeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const allExpensesData = expenseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const allExpensesPnl = allExpensesData.filter(isPnlExpense);

      let cashNetAdjustment = 0;
      cashMonthSnap.docs.forEach((d) => {
        const row = d.data();
        if (row.affectsSummaryNet !== true) return;
        cashNetAdjustment +=
          Number(row.credit || 0) + Number(row.debit || 0);
      });

      // Filter by selected date range
      const filteredIncome = allIncomeData.filter((item) =>
        isDateInRange(item.date, rangeStart, rangeEnd)
      );
      const filteredExpenses = allExpensesData.filter((item) =>
        isDateInRange(item.date, rangeStart, rangeEnd)
      );

      setIncomeData(filteredIncome);
      setExpenseData(filteredExpenses);

      // Calculate month net balance recursively (cash-book expenses excluded from P&L)
      const calculateMonthNetBalance = (monthStr) => {
        if (monthStr === JULY_2025) {
          const julyIncome = allIncomeData.filter((item) => isSameMonth(item.date, monthStr));
          const julyExpenses = allExpensesPnl.filter((item) => isSameMonth(item.date, monthStr));
          return JULY_START_BALANCE + (calculateMonthTotals(julyIncome) - calculateMonthTotals(julyExpenses));
        } else if (monthStr > JULY_2025) {
          const prevMonthStr = getPreviousMonth(monthStr);
          const prevMonthNetBalance = calculateMonthNetBalance(prevMonthStr);
          
          const currentIncome = allIncomeData.filter((item) => isSameMonth(item.date, monthStr));
          const currentExpenses = allExpensesPnl.filter((item) => isSameMonth(item.date, monthStr));
          
          return prevMonthNetBalance + (calculateMonthTotals(currentIncome) - calculateMonthTotals(currentExpenses));
        } else {
          const previousIncome = allIncomeData.filter(item => isBeforeMonth(item.date, monthStr));
          const previousExpenses = allExpensesPnl.filter(item => isBeforeMonth(item.date, monthStr));
          return calculateMonthTotals(previousIncome) - calculateMonthTotals(previousExpenses);
        }
      };

      // Calculate start balance
      let startBalance = 0;
      if (referenceMonth === JULY_2025) {
        startBalance = JULY_START_BALANCE;
      } else if (referenceMonth > JULY_2025) {
        const prevMonthStr = getPreviousMonth(referenceMonth);
        startBalance = calculateMonthNetBalance(prevMonthStr);
      } else {
        const previousIncome = allIncomeData.filter((item) =>
          isBeforeMonth(item.date, referenceMonth)
        );
        const previousExpenses = allExpensesPnl.filter((item) =>
          isBeforeMonth(item.date, referenceMonth)
        );
        startBalance = calculateMonthTotals(previousIncome) - calculateMonthTotals(previousExpenses);
      }

      // Calculate current month statistics (bank / non-cash expenses only for P&L)
      const totalIncome = calculateMonthTotals(filteredIncome);
      const totalExpenses = calculateMonthTotals(filteredExpenses.filter(isPnlExpense));
      const currentMonthNetBalance = totalIncome - totalExpenses;
      let netBalance = startBalance + currentMonthNetBalance;
      netBalance -= cashNetAdjustment;

      setSummaryStats({
        totalIncome,
        totalExpenses,
        netBalance,
        startBalance
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const incomeByCategory = {};
    const expenseByCategory = {};

    incomeData.forEach(item => {
      const category = item.category || 'Other';
      incomeByCategory[category] = (incomeByCategory[category] || 0) + Number(item.amount || 0);
    });

    expenseData.filter(isPnlExpense).forEach(item => {
      const category = item.category || 'Other';
      expenseByCategory[category] = (expenseByCategory[category] || 0) + Number(item.amount || 0);
    });

    return {
      income: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
      expenses: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
    };
  }, [incomeData, expenseData]);

  const handleCategoryClick = (category, type) => {
    setSelectedCategory(category);
    setSelectedType(type);
    setShowTransactionModal(true);
  };

  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setSelectedCategory(null);
    setSelectedType(null);
  };

  if (loading) {
    return (
      <div className="app-card-loader">
        <AppLoader message="Loading summary..." variant="inline" />
      </div>
    );
  }

  return (
    <div className="summary-page">
      <Row className="mb-4 justify-content-center summary-kpi-row g-3">
        <StatCard
          index={0}
          className="income-card"
          label="Total Income"
          value={summaryStats.totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          valueClassName="summary-value--income"
          suffix="PKR"
        />
        <StatCard
          index={1}
          className="expense-card"
          label="Total Expenses"
          value={summaryStats.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          valueClassName="summary-value--expense"
          suffix="PKR"
        />
        <StatCard
          index={2}
          className="balance-card"
          label="Net Balance"
          value={summaryStats.netBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          valueClassName={summaryStats.netBalance >= 0 ? "summary-value--balance" : "summary-value--negative"}
          suffix="PKR (period)"
        />
        <StatCard
          index={3}
          className="wallet-card"
          label="Start Balance"
          value={summaryStats.startBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          valueClassName={summaryStats.startBalance >= 0 ? "summary-value--wallet" : "summary-value--negative"}
          suffix="PKR"
        />
      </Row>

      <Row className="mb-4 align-items-stretch g-3">
        <CategoryPieChartCard
          data={chartData.income}
          colors={INCOME_COLORS}
          Icon={SummaryIcons.arrowUp}
          headerTitle="Income by Category"
        />
        <CategoryExpenseBarChartCard
          data={chartData.expenses}
          colors={EXPENSE_COLORS}
          Icon={SummaryIcons.arrowDown}
          headerTitle="Expenses by Category"
          onCategoryClick={handleCategoryClick}
          totalForPercent={summaryStats.totalExpenses}
        />
      </Row>

      <Row className="align-items-stretch g-3">
        <CategorySummaryPagele
          data={chartData.income}
          total={summaryStats.totalIncome}
          type="income"
          onRowClick={handleCategoryClick}
          title="Income Summary"
          valueClassName="summary-amount--income"
          sign="+"
        />
        <CategorySummaryPagele
          data={chartData.expenses}
          total={summaryStats.totalExpenses}
          type="expense"
          onRowClick={handleCategoryClick}
          title="Expense Summary"
          valueClassName="summary-amount--expense"
          sign="-"
        />
      </Row>

      <CategoryTransactionModal
        show={showTransactionModal}
        onHide={handleCloseModal}
        category={selectedCategory}
        type={selectedType}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
      />
    </div>
  );
};

export default SummaryPage;
