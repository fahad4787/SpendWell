import { createPortal } from "react-dom";
import { Dropdown } from "react-bootstrap";
import { FIXED_MENU_POPPER_CONFIG } from "../../utils/tableDropdownPopper";

/**
 * Renders the menu in document.body so sticky table cells / overflow wrappers
 * cannot clip it or stack above it.
 */
export default function PortaledDropdownMenu({
  children,
  className,
  popperConfig = FIXED_MENU_POPPER_CONFIG,
  renderOnMount = false,
  ...rest
}) {
  const menu = (
    <Dropdown.Menu
      popperConfig={popperConfig}
      renderOnMount={renderOnMount}
      className={["table-dropdown-menu-portal", className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </Dropdown.Menu>
  );

  if (typeof document === "undefined") return menu;
  return createPortal(menu, document.body);
}
