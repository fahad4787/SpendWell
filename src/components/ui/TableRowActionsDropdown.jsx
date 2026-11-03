import { useCallback, useEffect, useRef, useState } from "react";
import { Dropdown } from "react-bootstrap";
import { FiMoreVertical } from "react-icons/fi";
import { FIXED_MENU_POPPER_CONFIG, reflowTableDropdown } from "../../utils/tableDropdownPopper";
import PortaledDropdownMenu from "./PortaledDropdownMenu";

/**
 * Close on scroll instead of forcing window.resize (keeps table scroll smooth).
 */
const TableRowActionsDropdown = ({
  id,
  children,
  align = "end",
  "aria-label": ariaLabel = "Row actions",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef(null);

  const handleToggle = useCallback((nextOpen) => {
    setIsOpen(nextOpen);
    reflowTableDropdown(nextOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const close = () => setIsOpen(false);
    const scrollEls = [];
    let cur = toggleRef.current?.parentElement || null;

    while (cur) {
      const style = window.getComputedStyle(cur);
      const canScrollY =
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        cur.scrollHeight > cur.clientHeight;
      const canScrollX =
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        cur.scrollWidth > cur.clientWidth;
      if (canScrollY || canScrollX) scrollEls.push(cur);
      cur = cur.parentElement;
    }

    window.addEventListener("scroll", close, { passive: true });
    scrollEls.forEach((el) => el.addEventListener("scroll", close, { passive: true }));

    return () => {
      window.removeEventListener("scroll", close);
      scrollEls.forEach((el) => el.removeEventListener("scroll", close));
    };
  }, [isOpen]);

  return (
    <Dropdown show={isOpen} align={align} onToggle={handleToggle}>
      <span ref={toggleRef} className="d-inline-flex">
        <Dropdown.Toggle
          variant="light"
          id={id}
          className="table-row-actions-toggle p-0 border-0 bg-transparent"
          aria-label={ariaLabel}
        >
          <FiMoreVertical className="table-row-actions-icon" />
        </Dropdown.Toggle>
      </span>
      <PortaledDropdownMenu
        popperConfig={FIXED_MENU_POPPER_CONFIG}
        className="table-row-actions-menu"
      >
        {children}
      </PortaledDropdownMenu>
    </Dropdown>
  );
};

export default TableRowActionsDropdown;
