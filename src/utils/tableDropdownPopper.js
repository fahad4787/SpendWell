/**
 * Menus inside cards / table wrappers: use fixed positioning + reflow on open
 * so Popper doesn’t mis-measure or grow scrollbars on first open.
 */
export const FIXED_MENU_POPPER_CONFIG = { strategy: "fixed" };

export function reflowTableDropdown(nextOpen) {
  if (!nextOpen) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  });
}
