// Pure admin logic. No Vue imports live here: filtering, pagination, bulk
// mutations, MRR maths, usage summaries, sparkline geometry and audit diffs are
// plain functions so node:test can exercise them without a DOM or a component.

export type PlanId = "starter" | "growth" | "scale";
export type AccountStatus = "active" | "trial" | "past_due" | "suspended";
export type AccountSort = "name" | "mrr" | "seats" | "lastActive";

export interface Plan {
  id: PlanId;
  name: string;
  pricePerSeat: number;
  seatLimit: number;
  blurb: string;
  features: string[];
  /** Weekly MRR for the sparkline on the plan card. */
  trend: number[];
}

export interface Account {
  id: string;
  name: string;
  domain: string;
  owner: string;
  plan: PlanId;
  status: AccountStatus;
  seats: number;
  createdAt: string;
  lastActiveAt: string;
  region: string;
}

export interface UsageMetric {
  id: string;
  label: string;
  unit: string;
  current: number;
  limit: number;
  points: number[];
}

export interface AuditChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  targetType: "account" | "workspace";
  targetId: string;
  targetName: string;
  changes: AuditChange[];
  note?: string;
}

export interface AccountFilters {
  query: string;
  plan: PlanId | "all";
  status: AccountStatus | "all";
  sort: AccountSort;
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: AccountFilters = {
  query: "",
  plan: "all",
  status: "all",
  sort: "name",
  direction: "asc",
  page: 1,
  pageSize: 8,
};

export type BulkAction =
  | { type: "suspend" }
  | { type: "reactivate" }
  | { type: "change-plan"; plan: PlanId };

export const STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  trial: "Trial",
  past_due: "Past due",
  suspended: "Suspended",
};

export function parseDate(iso: string): number {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? time : 0;
}

export function isPlanId(value: string): value is PlanId {
  return value === "starter" || value === "growth" || value === "scale";
}

export function planById(plans: Plan[], id: PlanId): Plan | null {
  return plans.find((plan) => plan.id === id) || null;
}

export function planName(plans: Plan[], id: PlanId): string {
  return planById(plans, id)?.name || id;
}

/** MRR only counts paying seats: trials are free and suspended accounts are 0. */
export function accountMrr(account: Account, plans: Plan[]): number {
  if (account.status === "trial" || account.status === "suspended") return 0;
  const plan = planById(plans, account.plan);
  return plan ? plan.pricePerSeat * account.seats : 0;
}

export function accountSeatCapacity(account: Account, plans: Plan[]): number {
  return planById(plans, account.plan)?.seatLimit || 0;
}

export function filterAccounts(accounts: Account[], filters: AccountFilters, plans: Plan[]): Account[] {
  const query = filters.query.trim().toLowerCase();
  const rows = accounts.filter((account) => {
    if (filters.plan !== "all" && account.plan !== filters.plan) return false;
    if (filters.status !== "all" && account.status !== filters.status) return false;
    if (!query) return true;
    return `${account.name} ${account.domain} ${account.owner} ${account.region}`
      .toLowerCase()
      .includes(query);
  });

  const direction = filters.direction === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    let base = 0;
    if (filters.sort === "name") base = a.name.localeCompare(b.name);
    else if (filters.sort === "seats") base = a.seats - b.seats;
    else if (filters.sort === "lastActive") base = parseDate(a.lastActiveAt) - parseDate(b.lastActiveAt);
    else base = accountMrr(a, plans) - accountMrr(b, plans);
    return base !== 0 ? base * direction : a.name.localeCompare(b.name);
  });
  return rows;
}

export interface PageResult<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * size;
  const rows = items.slice(start, start + size);
  return {
    rows,
    page: current,
    pageSize: size,
    total,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: start + rows.length,
  };
}

export function visibleAccounts(accounts: Account[], filters: AccountFilters, plans: Plan[]): PageResult<Account> & { filtered: Account[] } {
  const filtered = filterAccounts(accounts, filters, plans);
  return { ...paginate(filtered, filters.page, filters.pageSize), filtered };
}

export interface AccountSummary {
  total: number;
  active: number;
  trial: number;
  pastDue: number;
  suspended: number;
  payingAccounts: number;
  atRisk: number;
  mrr: number;
  arr: number;
  seatsUsed: number;
  seatCapacity: number;
  utilisation: number;
  newThisMonth: number;
}

export function summariseAccounts(accounts: Account[], plans: Plan[], now = "2026-10-29"): AccountSummary {
  const count = (status: AccountStatus) => accounts.filter((account) => account.status === status).length;
  const mrr = accounts.reduce((sum, account) => sum + accountMrr(account, plans), 0);
  const seatsUsed = accounts
    .filter((account) => account.status !== "suspended")
    .reduce((sum, account) => sum + account.seats, 0);
  const seatCapacity = accounts
    .filter((account) => account.status !== "suspended")
    .reduce((sum, account) => sum + accountSeatCapacity(account, plans), 0);
  const month = now.slice(0, 7);
  return {
    total: accounts.length,
    active: count("active"),
    trial: count("trial"),
    pastDue: count("past_due"),
    suspended: count("suspended"),
    payingAccounts: accounts.filter((account) => accountMrr(account, plans) > 0).length,
    atRisk: count("past_due") + count("trial"),
    mrr,
    arr: mrr * 12,
    seatsUsed,
    seatCapacity,
    utilisation: seatCapacity ? seatsUsed / seatCapacity : 0,
    newThisMonth: accounts.filter((account) => account.createdAt.startsWith(month)).length,
  };
}

export interface PlanSummary {
  plan: Plan;
  accounts: number;
  active: number;
  mrr: number;
  seats: number;
  capacity: number;
  utilisation: number;
  mrrShare: number;
}

export function planSummaries(accounts: Account[], plans: Plan[]): PlanSummary[] {
  const totalMrr = accounts.reduce((sum, account) => sum + accountMrr(account, plans), 0);
  return plans.map((plan) => {
    const list = accounts.filter((account) => account.plan === plan.id);
    const mrr = list.reduce((sum, account) => sum + accountMrr(account, plans), 0);
    const seats = list.filter((account) => account.status !== "suspended").reduce((sum, account) => sum + account.seats, 0);
    const capacity = list.filter((account) => account.status !== "suspended").length * plan.seatLimit;
    return {
      plan,
      accounts: list.length,
      active: list.filter((account) => account.status === "active").length,
      mrr,
      seats,
      capacity,
      utilisation: capacity ? seats / capacity : 0,
      mrrShare: totalMrr ? mrr / totalMrr : 0,
    };
  });
}

export interface UsageSummary {
  percent: number;
  deltaPct: number;
  last: number;
  peak: number;
}

export function usageSummary(metric: UsageMetric): UsageSummary {
  const values = metric.points || [];
  const first = values[0] || 0;
  const last = values.at(-1) || 0;
  return {
    percent: metric.limit ? metric.current / metric.limit : 0,
    deltaPct: first ? (last - first) / first : 0,
    last,
    peak: values.length ? Math.max(...values) : 0,
  };
}

export interface SparklineGeometry {
  line: string;
  area: string;
  points: Array<{ x: number; y: number }>;
  min: number;
  max: number;
  last: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function sparkline(values: number[], width = 120, height = 32, pad = 2): SparklineGeometry {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) {
    return { line: "", area: "", points: [], min: 0, max: 0, last: 0 };
  }
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;
  const step = clean.length > 1 ? (width - pad * 2) / (clean.length - 1) : 0;
  const points = clean.map((value, index) => ({
    x: round(pad + step * index),
    y: round(height - pad - ((value - min) / span) * (height - pad * 2)),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const base = round(height - pad);
  const area = `M ${first.x} ${base} L ${first.x} ${first.y} ${points.slice(1).map((point) => `L ${point.x} ${point.y}`).join(" ")} L ${last.x} ${base} Z`;
  return { line, area, points, min, max, last: clean[clean.length - 1] };
}

export function diffAccounts(before: Account, after: Account, plans: Plan[]): AuditChange[] {
  const changes: AuditChange[] = [];
  if (before.plan !== after.plan) {
    changes.push({
      field: "plan", label: "Plan",
      before: planName(plans, before.plan),
      after: planName(plans, after.plan),
    });
  }
  if (before.status !== after.status) {
    changes.push({
      field: "status", label: "Status",
      before: STATUS_LABELS[before.status],
      after: STATUS_LABELS[after.status],
    });
  }
  if (before.seats !== after.seats) {
    changes.push({ field: "seats", label: "Seats", before: String(before.seats), after: String(after.seats) });
  }
  return changes;
}

export interface BulkResult {
  accounts: Account[];
  changed: Account[];
  skipped: number;
  changes: Map<string, AuditChange[]>;
}

export function applyBulkAction(accounts: Account[], ids: string[], action: BulkAction, plans: Plan[]): BulkResult {
  const selected = new Set(ids);
  const changed: Account[] = [];
  const changes = new Map<string, AuditChange[]>();
  let skipped = 0;

  const next = accounts.map((account) => {
    if (!selected.has(account.id)) return account;
    let updated: Account | null = null;

    if (action.type === "suspend") {
      if (account.status === "suspended") { skipped += 1; return account; }
      updated = { ...account, status: "suspended" };
    } else if (action.type === "reactivate") {
      if (account.status !== "suspended") { skipped += 1; return account; }
      updated = { ...account, status: "active" };
    } else {
      if (account.plan === action.plan) {
        skipped += 1;
        return account;
      }
      updated = { ...account, plan: action.plan };
    }

    if (!updated) { skipped += 1; return account; }
    const diff = diffAccounts(account, updated, plans);
    if (!diff.length) { skipped += 1; return account; }
    changes.set(account.id, diff);
    changed.push(updated);
    return updated;
  });

  return { accounts: next, changed, skipped, changes };
}

export function bulkActionLabel(action: BulkAction): string {
  if (action.type === "suspend") return "account.suspended";
  if (action.type === "reactivate") return "account.reactivated";
  return "account.plan_changed";
}

export function bulkActionVerb(action: BulkAction): string {
  if (action.type === "suspend") return "suspended";
  if (action.type === "reactivate") return "reactivated";
  return "moved to a new plan";
}

export function statusLabel(status: AccountStatus): string {
  return STATUS_LABELS[status];
}

export const ACTION_LABELS: Record<string, string> = {
  "account.suspended": "suspended an account",
  "account.reactivated": "reactivated an account",
  "account.plan_changed": "changed an account plan",
  "account.created": "created an account",
  "member.invited": "invited a member",
  "workspace.limit_changed": "raised a workspace limit",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] || action.replace(/[._]/g, " ");
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  return money.format(Math.round(value));
}

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const time = parseDate(iso);
  if (!time) return ", ";
  return new Date(time).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function relativeTime(iso: string, now = "2026-10-29T12:00:00Z"): string {
  const then = parseDate(iso);
  const current = parseDate(now);
  if (!then) return ", ";
  const minutes = Math.max(0, Math.round((current - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}
