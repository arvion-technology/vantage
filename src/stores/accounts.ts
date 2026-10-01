import { computed, reactive, ref, watch } from "vue";
import {
  DEFAULT_FILTERS, accountMrr, applyBulkAction, bulkActionLabel, bulkActionVerb,
  planSummaries, summariseAccounts, usageSummary, visibleAccounts,
} from "../lib/admin-core.ts";
import type {
  Account, AccountFilters, BulkAction, Plan, PlanId, UsageMetric,
} from "../lib/admin-core.ts";
import { seedAccounts, seedPlans, seedUsage } from "../data/seed.ts";
import { useAudit } from "./audit.ts";
import { useUi } from "./ui.ts";
import { downloadText, toCsv } from "../lib/download.ts";

export const DEMO_NOW = "2026-10-29T12:00:00Z";

const accounts = ref<Account[]>(seedAccounts());
const plans = ref<Plan[]>(seedPlans());
const usage = ref<UsageMetric[]>(seedUsage());
const filters = reactive<AccountFilters>({ ...DEFAULT_FILTERS });
const selectedIds = ref<string[]>([]);
const activeAccountId = ref<string | null>(accounts.value[0]?.id ?? null);

const filtered = computed(() => visibleAccounts(accounts.value, filters, plans.value));
const summary = computed(() => summariseAccounts(accounts.value, plans.value, DEMO_NOW));
const planCards = computed(() => planSummaries(accounts.value, plans.value));
const selectedAccounts = computed(() => accounts.value.filter((account) => selectedIds.value.includes(account.id)));
const activeAccount = computed(() => accounts.value.find((account) => account.id === activeAccountId.value) || null);
const usageCards = computed(() => usage.value.map((metric) => ({ metric, summary: usageSummary(metric) })));

const audit = useAudit();
const ui = useUi();

const recentForActive = computed(() => {
  if (!activeAccountId.value) return [];
  return audit.events.value
    .filter((event) => event.targetId === activeAccountId.value)
    .slice(0, 4);
});

watch(filtered, (result) => {
  if (!result.rows.length) return;
  if (!result.rows.some((account) => account.id === activeAccountId.value)) {
    activeAccountId.value = result.rows[0].id;
  }
}, { immediate: true });

function setFilter(patch: Partial<AccountFilters>): void {
  Object.assign(filters, patch);
  if (!("page" in patch)) filters.page = 1;
}

function resetFilters(): void {
  Object.assign(filters, DEFAULT_FILTERS);
}

function setPage(page: number): void {
  filters.page = Math.max(1, page);
}

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id);
}

function toggleSelected(id: string): void {
  selectedIds.value = isSelected(id)
    ? selectedIds.value.filter((entry) => entry !== id)
    : [...selectedIds.value, id];
}

function toggleVisible(): void {
  const ids = filtered.value.rows.map((account) => account.id);
  const allSelected = ids.length > 0 && ids.every(isSelected);
  selectedIds.value = allSelected
    ? selectedIds.value.filter((id) => !ids.includes(id))
    : [...new Set([...selectedIds.value, ...ids])];
}

function clearSelection(): void {
  selectedIds.value = [];
}

function setActiveAccount(id: string | null): void {
  activeAccountId.value = id;
}

function runBulk(action: BulkAction, ids = selectedIds.value): { changed: number; skipped: number } {
  if (!ids.length) return { changed: 0, skipped: 0 };
  const result = applyBulkAction(accounts.value, ids, action, plans.value);
  accounts.value = result.accounts;

  for (const account of result.changed) {
    audit.record({
      actor: "You",
      action: bulkActionLabel(action),
      targetType: "account",
      targetId: account.id,
      targetName: account.name,
      changes: result.changes.get(account.id) || [],
      note: ids.length > 1 ? `Bulk action across ${ids.length} selected accounts.` : undefined,
      at: DEMO_NOW,
    });
  }

  selectedIds.value = [];
  const verb = bulkActionVerb(action);
  if (result.changed.length) {
    ui.toast(
      `${result.changed.length} account${result.changed.length === 1 ? "" : "s"} ${verb}${result.skipped ? ` · ${result.skipped} skipped` : ""}`,
      "success",
    );
  } else {
    ui.toast(`No eligible accounts for that action (${result.skipped} skipped)`, "error");
  }
  return { changed: result.changed.length, skipped: result.skipped };
}

function changePlan(id: string, plan: PlanId): void {
  runBulk({ type: "change-plan", plan }, [id]);
}

function exportAccounts(): void {
  const columns = ["name", "domain", "owner", "plan", "status", "seats", "mrr", "region", "lastActiveAt"];
  const rows = accounts.value.map((account) => ({
    name: account.name,
    domain: account.domain,
    owner: account.owner,
    plan: account.plan,
    status: account.status,
    seats: account.seats,
    mrr: accountMrr(account, plans.value),
    region: account.region,
    lastActiveAt: account.lastActiveAt,
  }));
  downloadText("vantage-accounts.csv", toCsv(rows, columns), "text/csv");
  ui.toast("Accounts exported as CSV", "success");
}

export function useAccounts() {
  return {
    accounts,
    plans,
    usage,
    filters,
    filtered,
    summary,
    planCards,
    selectedIds,
    selectedAccounts,
    activeAccountId,
    activeAccount,
    recentForActive,
    usageCards,
    setFilter,
    resetFilters,
    setPage,
    isSelected,
    toggleSelected,
    toggleVisible,
    clearSelection,
    setActiveAccount,
    runBulk,
    changePlan,
    exportAccounts,
  };
}
