export const EXPENSE_ROLES = ["admin", "super_admin", "expense_manager", "expense"];

export const UNPROVISIONED_ROLE = "unprovisioned";

export function canAccessExpense(role) {
  return EXPENSE_ROLES.includes(role);
}

export function homePathForRole() {
  return "/";
}
