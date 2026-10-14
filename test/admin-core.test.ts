import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FILTERS, accountMrr, accountSeatCapacity, actionLabel, applyBulkAction,
  diffAccounts, filterAccounts, formatCompact, formatCurrency, formatDate, formatPercent,
  paginate, planName, planSummaries, relativeTime, sparkline, statusLabel,
  summariseAccounts, usageSummary, visibleAccounts,
} from "../src/lib/admin-core.ts";
import type { Account, AccountFilters, Plan } from "../src/lib/admin-core.ts";
import { seedAccounts, seedAudit, seedPlans, seedUsage } from "../src/data/seed.ts";
import { toCsv } from "../src/lib/download.ts";

const accounts = seedAccounts();
const plans = seedPlans();
const byId = (id: string): Account => {
  const found = accounts.find((account) => account.id === id);
  assert.ok(found, `missing seed account ${id}`);
  return found;
};
const filters = (patch: Partial<AccountFilters> = {}): AccountFilters => ({ ...DEFAULT_FILTERS, ...patch });

test("seed data is stable and sized for the console", () => {
  assert.equal(accounts.length, 15);
  assert.equal(plans.length, 3);
  assert.equal(seedAudit().length, 9);
  assert.equal(seedUsage().length, 4);
  assert.equal(new Set(accounts.map((account) => account.id)).size, accounts.length);
  // every account fits its plan's seat limit
  for (const account of accounts) {
    assert.ok(account.seats <= accountSeatCapacity(account, plans), `${account.name} over seat limit`);
    assert.ok(account.seats > 0);
  }
});

test("filters by free text across name, domain, owner and region", () => {
  assert.deepEqual(filterAccounts(accounts, filters({ query: "meridian" }), plans).map((a) => a.id), ["acc-1002"]);
  assert.deepEqual(filterAccounts(accounts, filters({ query: "northwind.coffee" }), plans).map((a) => a.id), ["acc-1001"]);
  assert.deepEqual(filterAccounts(accounts, filters({ query: "priya" }), plans).map((a) => a.id), ["acc-1008"]);
  assert.ok(filterAccounts(accounts, filters({ query: "kathmandu" }), plans).length >= 3);
  assert.ok(filterAccounts(accounts, filters({ query: "nothing-here" }), plans).length === 0);
});

test("filters by plan and status and combines them", () => {
  const trials = filterAccounts(accounts, filters({ status: "trial" }), plans);
  assert.deepEqual(trials.map((a) => a.id).sort(), ["acc-1004", "acc-1008", "acc-1013", "acc-1015"]);
  const scale = filterAccounts(accounts, filters({ plan: "scale" }), plans);
  assert.deepEqual(scale.map((a) => a.id).sort(), ["acc-1002", "acc-1006", "acc-1011", "acc-1015"]);
  const growthActive = filterAccounts(accounts, filters({ plan: "growth", status: "active" }), plans);
  assert.deepEqual(growthActive.map((a) => a.id).sort(), ["acc-1001", "acc-1007", "acc-1010"]);
});

test("sorting handles name, MRR, seats and last active", () => {
  const mrrDesc = filterAccounts(accounts, filters({ sort: "mrr", direction: "desc" }), plans);
  assert.equal(mrrDesc[0].id, "acc-1006");
  assert.equal(mrrDesc.at(-1).id, "acc-1013");
  const mrrAsc = filterAccounts(accounts, filters({ sort: "mrr", direction: "asc" }), plans);
  assert.equal(mrrAsc[0].id, "acc-1004");
  const seatsDesc = filterAccounts(accounts, filters({ sort: "seats", direction: "desc" }), plans);
  assert.equal(seatsDesc[0].id, "acc-1006");
  const nameAsc = filterAccounts(accounts, filters({ sort: "name", direction: "asc" }), plans);
  assert.equal(nameAsc[0].name, "Atlas Freight");
  const recent = filterAccounts(accounts, filters({ sort: "lastActive", direction: "desc" }), plans);
  assert.equal(recent[0].id, "acc-1006");
});

test("pagination clamps the page and reports the visible range", () => {
  const first = paginate(accounts, 1, 8);
  assert.equal(first.rows.length, 8);
  assert.equal(first.from, 1);
  assert.equal(first.to, 8);
  assert.equal(first.totalPages, 2);
  const second = paginate(accounts, 2, 8);
  assert.equal(second.rows.length, 7);
  assert.equal(second.from, 9);
  assert.equal(second.to, 15);
  const clamped = paginate(accounts, 99, 8);
  assert.equal(clamped.page, 2);
  const empty = paginate([], 4, 8);
  assert.deepEqual({ page: empty.page, total: empty.total, from: empty.from, to: empty.to }, { page: 1, total: 0, from: 0, to: 0 });
});

test("visibleAccounts combines filter and page state", () => {
  const result = visibleAccounts(accounts, filters({ status: "trial", pageSize: 2 }), plans);
  assert.equal(result.total, 4);
  assert.equal(result.totalPages, 2);
  assert.equal(result.rows.length, 2);
  assert.equal(result.filtered.length, 4);
});

test("account MRR follows plan price, seats and status", () => {
  assert.equal(accountMrr(byId("acc-1001"), plans), 18 * 59);
  assert.equal(accountMrr(byId("acc-1002"), plans), 64 * 99);
  assert.equal(accountMrr(byId("acc-1004"), plans), 0); // trial
  assert.equal(accountMrr(byId("acc-1009"), plans), 0); // suspended
  assert.equal(accountMrr(byId("acc-1005"), plans), 3 * 29); // past due still billed
});

test("summariseAccounts computes counts, MRR, seats and new accounts", () => {
  const summary = summariseAccounts(accounts, plans, "2026-10-29");
  assert.equal(summary.total, 15);
  assert.equal(summary.active, 8);
  assert.equal(summary.trial, 4);
  assert.equal(summary.pastDue, 2);
  assert.equal(summary.suspended, 1);
  assert.equal(summary.payingAccounts, 10);
  assert.equal(summary.atRisk, 6);
  assert.equal(summary.mrr, 23585);
  assert.equal(summary.arr, 283020);
  assert.equal(summary.seatsUsed, 323);
  assert.equal(summary.seatCapacity, 570);
  assert.ok(Math.abs(summary.utilisation - 323 / 570) < 1e-9);
  assert.equal(summary.newThisMonth, 4);
});

test("planSummaries split accounts, MRR and seats by plan", () => {
  const summaries = planSummaries(accounts, plans);
  assert.equal(summaries.length, 3);
  const [starter, growth, scale] = summaries;
  assert.equal(starter.accounts, 5);
  assert.equal(growth.accounts, 6);
  assert.equal(scale.accounts, 4);
  assert.equal(growth.mrr, 18 * 59 + 21 * 59 + 14 * 59 + 17 * 59);
  assert.equal(scale.mrr, 64 * 99 + 88 * 99 + 41 * 99);
  assert.ok(Math.abs(summaries.reduce((sum, entry) => sum + entry.mrrShare, 0) - 1) < 1e-9);
  assert.equal(planName(plans, "growth"), "Growth");
});

test("usageSummary reports percentage, delta and peak", () => {
  const metric = seedUsage()[0];
  const summary = usageSummary(metric);
  assert.equal(summary.last, metric.points.at(-1));
  assert.equal(summary.peak, Math.max(...metric.points));
  assert.ok(summary.percent > 0 && summary.percent < 1);
  assert.ok(summary.deltaPct > 0);
  const empty = usageSummary({ id: "x", label: "x", unit: "x", current: 0, limit: 0, points: [] });
  assert.deepEqual(empty, { percent: 0, deltaPct: 0, last: 0, peak: 0 });
});

test("sparkline geometry stays inside the viewport and is deterministic", () => {
  const values = [4, 7, 5, 9, 11, 8, 12];
  const first = sparkline(values, 200, 50);
  const second = sparkline(values, 200, 50);
  assert.deepEqual(first, second);
  assert.equal(first.points.length, values.length);
  assert.equal(first.min, 4);
  assert.equal(first.max, 12);
  assert.equal(first.last, 12);
  for (const point of first.points) {
    assert.ok(point.x >= 0 && point.x <= 200);
    assert.ok(point.y >= 0 && point.y <= 50);
  }
  assert.ok(first.line.startsWith("M "));
  assert.ok(first.area.endsWith("Z"));
  assert.deepEqual(sparkline([], 100, 20), { line: "", area: "", points: [], min: 0, max: 0, last: 0 });
  const flat = sparkline([5, 5, 5], 100, 20);
  assert.equal(flat.min, 5);
  assert.equal(flat.max, 5);
  assert.ok(flat.points.every((point) => point.y === flat.points[0].y));
});

test("diffAccounts reports only the fields that changed", () => {
  const before = byId("acc-1001");
  const after: Account = { ...before, status: "suspended", seats: 20 };
  const changes = diffAccounts(before, after, plans);
  assert.deepEqual(changes.map((change) => change.field), ["status", "seats"]);
  assert.equal(changes[0].before, "Active");
  assert.equal(changes[0].after, "Suspended");
  const planChange = diffAccounts(before, { ...before, plan: "scale" }, plans);
  assert.deepEqual(planChange, [{ field: "plan", label: "Plan", before: "Growth", after: "Scale" }]);
  assert.deepEqual(diffAccounts(before, { ...before }, plans), []);
});

test("applyBulkAction suspends in one pass without mutating the input", () => {
  const before = seedAccounts();
  const result = applyBulkAction(before, ["acc-1001", "acc-1003"], { type: "suspend" }, plans);
  assert.equal(result.changed.length, 2);
  assert.equal(result.skipped, 0);
  assert.equal(result.accounts.find((a) => a.id === "acc-1001")?.status, "suspended");
  assert.equal(before.find((a) => a.id === "acc-1001")?.status, "active");
  assert.deepEqual(result.changes.get("acc-1001")?.map((change) => change.field), ["status"]);
});

test("applyBulkAction skips ineligible rows", () => {
  const already = applyBulkAction(seedAccounts(), ["acc-1009"], { type: "suspend" }, plans);
  assert.equal(already.changed.length, 0);
  assert.equal(already.skipped, 1);
  const reactivate = applyBulkAction(seedAccounts(), ["acc-1009"], { type: "reactivate" }, plans);
  assert.equal(reactivate.changed.length, 1);
  assert.equal(reactivate.accounts.find((a) => a.id === "acc-1009")?.status, "active");
  const active = applyBulkAction(seedAccounts(), ["acc-1001"], { type: "reactivate" }, plans);
  assert.equal(active.changed.length, 0);
});

test("applyBulkAction changes plans and skips no-ops", () => {
  const result = applyBulkAction(seedAccounts(), ["acc-1001", "acc-1002"], { type: "change-plan", plan: "scale" }, plans);
  assert.equal(result.changed.length, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.accounts.find((a) => a.id === "acc-1001")?.plan, "scale");
  assert.equal(result.changes.get("acc-1001")?.[0].after, "Scale");
  // MRR is derived, so the plan change moves it
  assert.equal(accountMrr(result.accounts.find((a) => a.id === "acc-1001")!, plans), 18 * 99);
});

test("format helpers and labels match the console copy", () => {
  assert.equal(formatCurrency(23675), "$23,675");
  assert.equal(formatCompact(8_420_000), "8.4M");
  assert.equal(formatPercent(0.804), "80%");
  assert.equal(statusLabel("past_due"), "Past due");
  assert.equal(actionLabel("account.plan_changed"), "changed an account plan");
  assert.equal(actionLabel("custom.event"), "custom event");
  assert.equal(formatDate("2026-10-29"), "29 Oct 2026");
  assert.equal(relativeTime("2026-10-29T11:00:00Z"), "1h ago");
  assert.equal(relativeTime("2026-10-24T12:00:00Z"), "5d ago");
});

test("toCsv escapes commas, quotes and newlines", () => {
  const csv = toCsv([{ name: "Acme, Inc", note: 'a "quote"', plain: 3 }], ["name", "note", "plain"]);
  assert.equal(csv.split("\n")[0], "name,note,plain");
  assert.ok(csv.includes('"Acme, Inc"'));
  assert.ok(csv.includes('"a ""quote"""'));
});

test("plan seat limits and action labels are exported for the UI", () => {
  assert.equal(accountSeatCapacity(byId("acc-1002"), plans), 100);
  assert.equal(accountSeatCapacity(byId("acc-1003"), plans), 5);
  assert.equal(planName(plans, "starter"), "Starter");
  const plansById = new Map<string, Plan>(plans.map((plan) => [plan.id, plan]));
  for (const plan of plans) assert.equal(plansById.get(plan.id)?.name, plan.name);
});
