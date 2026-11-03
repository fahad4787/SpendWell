import { ConfigProvider } from "antd";
import { THEME } from "../../theme/colors";

const ANTD_THEME = {
  token: {
    colorPrimary: THEME.charcoal,
    colorInfo: THEME.lime,
    colorSuccess: THEME.positive,
    colorText: THEME.shellText,
    colorTextSecondary: THEME.shellMuted,
    colorBorder: THEME.shellBorder,
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    borderRadius: 12,
    fontFamily: '"Geist", "Inter", system-ui, sans-serif',
    controlOutline: "rgba(184, 243, 75, 0.35)",
  },
  components: {
    DatePicker: {
      activeBorderColor: THEME.charcoal,
      hoverBorderColor: "#B0B0A8",
      cellActiveWithRangeBg: THEME.primaryTint,
      cellHoverBg: THEME.shellSurface,
    },
    Segmented: {
      itemSelectedBg: THEME.lime,
      itemSelectedColor: THEME.charcoal,
      trackBg: THEME.shellSurface,
    },
  },
};

/** Keeps antd off the login/setup entry path — only wrap authenticated UI. */
export default function AntdAppProvider({ children }) {
  return <ConfigProvider theme={ANTD_THEME}>{children}</ConfigProvider>;
}
