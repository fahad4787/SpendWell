import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Segmented } from "antd";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from "dayjs/plugin/updateLocale";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.updateLocale("en", { weekStart: 1 });

const toIso = (d) => (d ? d.format("YYYY-MM-DD") : "");

const startOfIsoWeek = (d) => d.startOf("isoWeek");
const endOfIsoWeek = (d) => d.endOf("isoWeek");

const startOfMonth = (d) => d.startOf("month");
const endOfMonth = (d) => d.endOf("month");

const parseYmd = (ymd) => {
  if (!ymd) return null;
  const parsed = dayjs(ymd);
  return parsed.isValid() ? parsed : null;
};

const formatWeekLabel = (value) => {
  if (!value) return "";
  const ws = startOfIsoWeek(value);
  const we = endOfIsoWeek(value);
  if (ws.isSame(we, "month")) {
    return `${ws.format("MMM D")} – ${we.format("D, YYYY")}`;
  }
  return `${ws.format("MMM D")} – ${we.format("MMM D, YYYY")}`;
};

const weekAnchorFromRange = (rangeValue) => {
  const today = dayjs();
  if (!rangeValue?.[0]) return today;

  const monthStart = rangeValue[0].startOf("month");
  const monthEnd = (rangeValue[1] || rangeValue[0]).endOf("month");

  if (!today.isBefore(monthStart, "day") && !today.isAfter(monthEnd, "day")) {
    return today;
  }

  return monthStart.add(14, "day");
};

const isExactIsoWeek = (start, end) => {
  if (!start || !end) return false;
  const ws = startOfIsoWeek(start);
  const we = endOfIsoWeek(start);
  return start.isSame(ws, "day") && end.isSame(we, "day");
};

const isExactMonth = (start, end) => {
  if (!start || !end) return false;
  const ms = startOfMonth(start);
  const me = endOfMonth(start);
  return start.isSame(ms, "day") && end.isSame(me, "day");
};

const modeFitsRange = (mode, rangeStart, rangeEnd, allowAll) => {
  if (mode === "all") return Boolean(allowAll) && !rangeStart && !rangeEnd;
  const start = parseYmd(rangeStart);
  const end = parseYmd(rangeEnd);
  if (!start || !end) return false;
  if (mode === "week") return isExactIsoWeek(start, end);
  if (mode === "month") return isExactMonth(start, end);
  if (mode === "range") return true;
  return false;
};

const inferDateFilterMode = (rangeStart, rangeEnd, allowAll, fallback) => {
  if (!rangeStart && !rangeEnd) return allowAll ? "all" : fallback;
  const start = parseYmd(rangeStart);
  const end = parseYmd(rangeEnd);
  if (!start || !end) return fallback;
  if (isExactIsoWeek(start, end)) return "week";
  if (isExactMonth(start, end)) return "month";
  return "range";
};

const AppDateFilter = ({
  rangeStart,
  rangeEnd,
  onChange,
  defaultMode = "month",
  modes,
  allowAll = true,
  showPresets = false,
  className = "",
  size = "middle",
}) => {
  const initialMode = useMemo(() => {
    if (Array.isArray(modes) && modes.length > 0) {
      if (modes.includes(defaultMode)) return defaultMode;
      return String(modes[0]);
    }
    return defaultMode;
  }, [defaultMode, modes]);
  const [userMode, setUserMode] = useState(initialMode);
  const mode = modeFitsRange(userMode, rangeStart, rangeEnd, allowAll)
    ? userMode
    : inferDateFilterMode(rangeStart, rangeEnd, allowAll, initialMode);

  useEffect(() => {
    if (rangeStart || rangeEnd) return;
    if (initialMode === "all") return;

    const today = dayjs();
    if (initialMode === "week") {
      onChange?.({
        rangeStart: toIso(startOfIsoWeek(today)),
        rangeEnd: toIso(endOfIsoWeek(today)),
        mode: "week",
      });
    } else if (initialMode === "month") {
      onChange?.({
        rangeStart: toIso(startOfMonth(today)),
        rangeEnd: toIso(endOfMonth(today)),
        mode: "month",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rangeValue = useMemo(() => {
    const s = parseYmd(rangeStart);
    const e = parseYmd(rangeEnd);
    if (!s || !e) return null;
    return [s, e];
  }, [rangeStart, rangeEnd]);

  const weekPickerValue = useMemo(() => {
    if (!rangeValue?.[0]) return null;
    return startOfIsoWeek(rangeValue[0]);
  }, [rangeValue]);

  const presets = useMemo(() => {
    const today = dayjs();
    const thisWeekStart = startOfIsoWeek(today);
    const thisWeekEnd = endOfIsoWeek(today);
    const thisMonthStart = startOfMonth(today);
    const thisMonthEnd = endOfMonth(today);

    return [
      { label: "Today", start: today.startOf("day"), end: today.endOf("day") },
      { label: "This Week", start: thisWeekStart, end: thisWeekEnd },
      { label: "This Month", start: thisMonthStart, end: thisMonthEnd },
      { label: "Last 7 Days", start: today.subtract(6, "day").startOf("day"), end: today.endOf("day") },
      { label: "Last 30 Days", start: today.subtract(29, "day").startOf("day"), end: today.endOf("day") },
    ];
  }, []);

  const applyRange = (start, end) => {
    onChange?.({
      rangeStart: toIso(start),
      rangeEnd: toIso(end),
      mode,
    });
  };

  const shiftPeriod = (direction) => {
    if (mode === "all" || !rangeValue?.[0] || !rangeValue?.[1]) return;
    const [start, end] = rangeValue;

    if (mode === "week") {
      const anchor = startOfIsoWeek(start).add(direction, "week");
      onChange?.({
        rangeStart: toIso(startOfIsoWeek(anchor)),
        rangeEnd: toIso(endOfIsoWeek(anchor)),
        mode: "week",
      });
      return;
    }

    if (mode === "month") {
      const anchor = startOfMonth(start).add(direction, "month");
      onChange?.({
        rangeStart: toIso(startOfMonth(anchor)),
        rangeEnd: toIso(endOfMonth(anchor)),
        mode: "month",
      });
      return;
    }

    const days = end.diff(start, "day") + 1;
    if (direction < 0) {
      const prevEnd = start.subtract(1, "day");
      const prevStart = prevEnd.subtract(days - 1, "day");
      onChange?.({
        rangeStart: toIso(prevStart),
        rangeEnd: toIso(prevEnd),
        mode: "range",
      });
      return;
    }

    const nextStart = end.add(1, "day");
    const nextEnd = nextStart.add(days - 1, "day");
    onChange?.({
      rangeStart: toIso(nextStart),
      rangeEnd: toIso(nextEnd),
      mode: "range",
    });
  };

  const onPreset = (preset) => {
    setUserMode("range");
    onChange?.({
      rangeStart: toIso(preset.start),
      rangeEnd: toIso(preset.end),
      mode: "range",
    });
  };

  const modeOptions = useMemo(() => {
    const all = [
      { label: "Month", value: "month" },
      { label: "Week", value: "week" },
      { label: "Range", value: "range" },
    ];
    const allowed = Array.isArray(modes) && modes.length > 0
      ? all.filter((m) => modes.includes(m.value))
      : all;
    const withAll = allowAll ? [...allowed, { label: "All", value: "all" }] : allowed;
    return withAll;
  }, [allowAll, modes]);

  return (
    <div className={`app-date-filter app-date-filter--${size} ${className}`.trim()}>
      <div className="app-date-filter__row">
        <Segmented
          size={size}
          value={mode}
          options={modeOptions}
          onChange={(v) => {
            const next = String(v);
            setUserMode(next);
            if (next === "all") {
              onChange?.({ rangeStart: "", rangeEnd: "", mode: "all" });
              return;
            }
            if (next === "week") {
              const anchor = weekAnchorFromRange(rangeValue);
              const ws = startOfIsoWeek(anchor);
              const we = endOfIsoWeek(anchor);
              onChange?.({ rangeStart: toIso(ws), rangeEnd: toIso(we), mode: "week" });
            } else if (next === "month") {
              const anchor = rangeValue?.[0] || dayjs();
              const ms = startOfMonth(anchor);
              const me = endOfMonth(anchor);
              onChange?.({ rangeStart: toIso(ms), rangeEnd: toIso(me), mode: "month" });
            } else if (next === "range") {
              if (rangeValue) {
                onChange?.({
                  rangeStart: toIso(rangeValue[0]),
                  rangeEnd: toIso(rangeValue[1]),
                  mode: "range",
                });
              } else {
                const today = dayjs();
                const ws = startOfIsoWeek(today);
                const we = endOfIsoWeek(today);
                onChange?.({ rangeStart: toIso(ws), rangeEnd: toIso(we), mode: "range" });
              }
            }
          }}
        />

        <div
          className={`app-date-filter__picker${
            mode === "week" ? " app-date-filter__picker--week" : mode === "range" ? " app-date-filter__picker--range" : ""
          }`}
        >
          {mode !== "all" ? (
            <button
              type="button"
              className="app-date-filter__nav"
              aria-label="Previous period"
              title="Previous"
              disabled={!rangeValue}
              onClick={() => shiftPeriod(-1)}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
          ) : null}

          <div className="app-date-filter__picker-field">
            {mode === "month" ? (
              <DatePicker
                picker="month"
                value={rangeValue ? rangeValue[0] : null}
                onChange={(d) => {
                  if (!d) return;
                  const ms = startOfMonth(d);
                  const me = endOfMonth(d);
                  onChange?.({ rangeStart: toIso(ms), rangeEnd: toIso(me), mode: "month" });
                }}
                format="MMMM YYYY"
                allowClear={false}
                size={size}
                className="app-date-filter__antd app-month-picker"
                style={{ width: "100%" }}
                getPopupContainer={(node) => node?.parentElement ?? document.body}
              />
            ) : mode === "week" ? (
              <DatePicker
                value={weekPickerValue}
                onChange={(d) => {
                  if (!d) return;
                  const ws = startOfIsoWeek(d);
                  const we = endOfIsoWeek(d);
                  onChange?.({ rangeStart: toIso(ws), rangeEnd: toIso(we), mode: "week" });
                }}
                format={formatWeekLabel}
                allowClear={false}
                size={size}
                className="app-date-filter__antd app-date-picker app-week-picker"
                style={{ width: "100%" }}
                getPopupContainer={(node) => node?.parentElement ?? document.body}
                cellRender={(current, info) => {
                  if (info.type !== "date") return info.originNode;
                  if (!weekPickerValue) return info.originNode;
                  const ws = startOfIsoWeek(weekPickerValue);
                  const we = endOfIsoWeek(weekPickerValue);
                  const inSelectedWeek =
                    !current.isBefore(ws, "day") && !current.isAfter(we, "day");
                  if (!inSelectedWeek) return info.originNode;
                  return (
                    <div className="ant-picker-cell-inner app-week-picker__day--in-week">
                      {current.date()}
                    </div>
                  );
                }}
              />
            ) : mode === "range" ? (
              <DatePicker.RangePicker
                value={rangeValue || undefined}
                onChange={(vals) => {
                  if (!vals || vals.length !== 2) return;
                  applyRange(vals[0], vals[1]);
                }}
                format="MMM D, YYYY"
                allowClear={false}
                size={size}
                className="app-date-filter__antd app-date-picker"
                style={{ width: "100%" }}
                getPopupContainer={(node) => node?.parentElement ?? document.body}
                presets={presets.map((p) => ({
                  label: p.label,
                  value: [p.start, p.end],
                }))}
              />
            ) : (
              <div className="app-date-filter__all" aria-label="All time">
                All time
              </div>
            )}
          </div>

          {mode !== "all" ? (
            <button
              type="button"
              className="app-date-filter__nav"
              aria-label="Next period"
              title="Next"
              disabled={!rangeValue}
              onClick={() => shiftPeriod(1)}
            >
              <FiChevronRight aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {showPresets ? (
        <div className="app-date-filter__presets">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="app-date-filter__preset"
              onClick={() => onPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AppDateFilter;
