import { DatePicker } from "antd";
import dayjs from "dayjs";

/**
 * Site-wide date picker (full calendar + quick month/year header navigation).
 * Value / onChange use ISO date strings: YYYY-MM-DD
 */
const AppDatePicker = ({
  value,
  onChange,
  className = "",
  disabled,
  size = "middle",
  showToday = true,
  allowClear = true,
  placeholder = "Select date",
  style,
  /** Prefer document.body inside modals so the calendar is not clipped. */
  getPopupContainer = () => document.body,
  ...rest
}) => {
  const parsed = value ? dayjs(value) : null;
  const dateValue = parsed?.isValid() ? parsed : null;

  return (
    <DatePicker
      value={dateValue}
      onChange={(d) => onChange?.(d ? d.format("YYYY-MM-DD") : "")}
      format="DD MMM YYYY"
      allowClear={allowClear}
      disabled={disabled}
      showToday={showToday}
      size={size}
      placeholder={placeholder}
      className={`app-date-picker ${className}`.trim()}
      style={{ width: "100%", ...style }}
      getPopupContainer={getPopupContainer}
      {...rest}
    />
  );
};

export default AppDatePicker;
