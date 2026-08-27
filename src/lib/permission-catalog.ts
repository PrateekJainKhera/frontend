// ─────────────────────────────────────────────────────────────────────────────
// Permission catalog — single source of truth for Roles & Permissions AND the
// sidebar. Each top-level module maps to its menu pages (submenus). A submenu's
// permission key is its route (href), which is unique and stable. The module key
// (e.g. "Masters") is kept for module-wide defaults and backward compatibility.
//
// When a role has NO explicit row for a submenu key, access falls back to the
// module-level permission (see canViewMenu / checkPermission in lib/auth.ts), so
// existing roles keep working until submenu permissions are set.
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Approve'] as const
export type PermAction = (typeof ALL_ACTIONS)[number]

const CRUD: PermAction[] = ['View', 'Create', 'Edit', 'Delete']
const CRUDA: PermAction[] = ['View', 'Create', 'Edit', 'Delete', 'Approve']
const VIEW: PermAction[] = ['View']

export interface PermNode {
  /** Permission key stored in Auth_Permissions.Module — the menu route. */
  key: string
  label: string
  actions: PermAction[]
}

export interface PermModule {
  /** Module key — matches the legacy module names. */
  key: string
  label: string
  /** Actions applicable at the module (bulk / fallback) level. */
  actions: PermAction[]
  children: PermNode[]
}

export const PERMISSION_CATALOG: PermModule[] = [
  {
    key: 'Dashboard', label: 'Dashboard', actions: VIEW,
    children: [],
  },
  {
    key: 'Masters', label: 'Masters', actions: CRUD,
    children: [
      { key: '/masters/customers', label: 'Customers', actions: CRUD },
      { key: '/masters/products', label: 'Products', actions: CRUD },
      { key: '/masters/materials', label: 'Materials', actions: CRUD },
      { key: '/masters/processes', label: 'Processes', actions: CRUD },
      { key: '/masters/drawings', label: 'Drawings', actions: CRUD },
      { key: '/masters/machines', label: 'Machines', actions: CRUD },
      { key: '/masters/operators', label: 'Operators', actions: CRUD },
      { key: '/masters/vendors', label: 'Vendors', actions: CRUD },
      { key: '/masters/shifts', label: 'Shifts', actions: CRUD },
      { key: '/masters/configurations', label: 'Configurations', actions: CRUD },
    ],
  },
  {
    key: 'Sales', label: 'Sales & Orders', actions: CRUDA,
    children: [
      { key: '/sales/estimations', label: 'Estimations', actions: CRUDA },
      { key: '/orders', label: 'Orders', actions: CRUDA },
    ],
  },
  {
    key: 'Procurement', label: 'Procurement', actions: CRUDA,
    children: [
      { key: '/procurement/purchase-requests', label: 'Purchase Requests', actions: CRUDA },
      { key: '/procurement/purchase-orders', label: 'Purchase Orders', actions: CRUDA },
    ],
  },
  {
    key: 'Planning', label: 'Planning', actions: CRUDA,
    children: [
      { key: '/drawing-review', label: 'Drawing Review', actions: CRUDA },
      { key: '/planning', label: 'Planning', actions: CRUD },
      { key: '/scheduling', label: 'Scheduling', actions: CRUD },
    ],
  },
  {
    key: 'Production', label: 'Production', actions: CRUDA,
    children: [
      { key: '/production', label: 'Production Dashboard', actions: VIEW },
      { key: '/production/execution', label: 'Execution', actions: CRUD },
      { key: '/production/osp', label: 'OSP Tracking', actions: CRUDA },
      { key: '/production/rework', label: 'Rework Approval', actions: CRUDA },
    ],
  },
  {
    key: 'Inventory', label: 'Inventory', actions: CRUDA,
    children: [
      { key: '/inventory/raw-materials', label: 'Raw Materials', actions: CRUD },
      { key: '/inventory/material-pieces', label: 'Material Pieces', actions: CRUD },
      { key: '/inventory/material-requisitions', label: 'Requisitions', actions: CRUDA },
      { key: '/inventory/receive-components', label: 'Receive Components', actions: CRUD },
      { key: '/inventory/component-issue', label: 'Issue to Shop Floor', actions: CRUD },
      { key: '/inventory/component-consume', label: 'Consume Components', actions: CRUD },
      { key: '/inventory/reconcile', label: 'Stock Reconcile', actions: CRUD },
      { key: '/inventory/wastage', label: 'Wastage & Scrap Sales', actions: CRUD },
      { key: '/inventory/warehouses', label: 'Warehouses', actions: CRUD },
      { key: '/inventory/grn-approvals', label: 'GRN Approvals', actions: CRUDA },
    ],
  },
  {
    key: 'Stores', label: 'Stores', actions: CRUD,
    children: [
      { key: '/stores/cutting-planning', label: 'Cutting Planning', actions: CRUD },
      { key: '/stores/issue-list', label: 'Issue List', actions: CRUD },
      { key: '/stores/opening-stock', label: 'Opening Stock', actions: CRUD },
    ],
  },
  {
    key: 'Dispatch', label: 'Dispatch', actions: CRUD,
    children: [],
  },
  {
    key: 'Quality', label: 'Quality', actions: CRUDA,
    children: [
      { key: '/quality/qc', label: 'Quality Check (QC)', actions: CRUDA },
      { key: '/quality/rejections', label: 'Rejections', actions: CRUDA },
      { key: '/production/rework', label: 'Rework Approval', actions: CRUDA },
    ],
  },
  {
    key: 'Reports', label: 'MIS / Reports', actions: VIEW,
    children: [
      { key: '/mis/executive', label: 'Executive', actions: VIEW },
      { key: '/mis/machine-models', label: 'Machine Models', actions: VIEW },
      { key: '/mis/production', label: 'Production', actions: VIEW },
      { key: '/mis/sales', label: 'Sales', actions: VIEW },
      { key: '/mis/agents', label: 'Agent Performance', actions: VIEW },
    ],
  },
  {
    key: 'Admin', label: 'Admin', actions: CRUD,
    children: [
      { key: '/admin/users', label: 'Users', actions: CRUD },
      { key: '/admin/roles', label: 'Roles & Permissions', actions: CRUD },
      { key: '/admin/audit', label: 'Audit Log', actions: VIEW },
      { key: '/admin/settings', label: 'System Settings', actions: ['View', 'Edit'] },
    ],
  },
]

/**
 * Flat list of every permission key + action pair — used when saving a role.
 * De-duplicated because a page can appear under two menus (e.g. "Rework Approval"
 * shows under both Production and Quality); without this the save would violate
 * the UNIQUE (RoleId, Module, Action) constraint and fail with a 400.
 */
export function allPermissionEntries(): { key: string; action: PermAction }[] {
  const seen = new Set<string>()
  const out: { key: string; action: PermAction }[] = []
  const add = (key: string, action: PermAction) => {
    const id = `${key}::${action}`
    if (seen.has(id)) return
    seen.add(id)
    out.push({ key, action })
  }
  for (const mod of PERMISSION_CATALOG) {
    mod.actions.forEach((a) => add(mod.key, a))
    for (const child of mod.children) {
      child.actions.forEach((a) => add(child.key, a))
    }
  }
  return out
}
