<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  accountMrr, accountSeatCapacity, actionLabel, formatCurrency, formatPercent, planName, relativeTime,
} from "../lib/admin-core.ts";
import type { Account, AccountFilters, AccountSort, PlanId } from "../lib/admin-core.ts";
import { useAccounts } from "../stores/accounts.ts";
import StatusBadge from "../components/StatusBadge.vue";
import DiffView from "../components/DiffView.vue";

const accountsStore = useAccounts();
const {
  filters, filtered, summary, plans, selectedIds, activeAccount, activeAccountId, recentForActive,
} = accountsStore;

const query = computed<string>({
  get: () => filters.query,
  set: (value: string) => accountsStore.setFilter({ query: value }),
});
const planFilter = computed<AccountFilters["plan"]>({
  get: () => filters.plan,
  set: (value) => accountsStore.setFilter({ plan: value }),
});
const statusFilter = computed<AccountFilters["status"]>({
  get: () => filters.status,
  set: (value) => accountsStore.setFilter({ status: value }),
});
const sortValue = computed<string>({
  get: () => `${filters.sort}-${filters.direction}`,
  set: (value: string) => {
    const [sort, direction] = value.split("-") as [AccountSort, "asc" | "desc"];
    accountsStore.setFilter({ sort, direction });
  },
});

const bulkPlan = ref<PlanId>("growth");
const detailPlan = ref<PlanId>("growth");
watch(activeAccount, (account) => {
  if (account) detailPlan.value = account.plan;
}, { immediate: true });

const selectedCount = computed(() => selectedIds.value.length);
const allVisibleSelected = computed(() => (
  filtered.value.rows.length > 0 && filtered.value.rows.every((account) => accountsStore.isSelected(account.id))
));
const hasFilters = computed(() => (
  filters.query !== "" || filters.plan !== "all" || filters.status !== "all"
));

const initials = (name: string): string => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const mrrFor = (account: Account): number => accountMrr(account, plans.value);
const capacityFor = (account: Account): number => accountSeatCapacity(account, plans.value);
const seatPercent = (account: Account): number => {
  const capacity = capacityFor(account);
  return capacity ? Math.round((account.seats / capacity) * 100) : 0;
};

const bulkSuspend = (): void => { accountsStore.runBulk({ type: "suspend" }); };
const bulkReactivate = (): void => { accountsStore.runBulk({ type: "reactivate" }); };
const bulkChangePlan = (): void => { accountsStore.runBulk({ type: "change-plan", plan: bulkPlan.value }); };
const go = (page: number): void => accountsStore.setPage(page);

const toggleActive = (): void => {
  if (!activeAccount.value) return;
  accountsStore.runBulk({
    type: activeAccount.value.status === "suspended" ? "reactivate" : "suspend",
  }, [activeAccount.value.id]);
};

const applyDetailPlan = (): void => {
  if (!activeAccount.value) return;
  accountsStore.changePlan(activeAccount.value.id, detailPlan.value);
};
</script>

<template>
  <section class="view accounts-view">
    <div class="page-head">
      <div>
        <div class="eyebrow">Customers</div>
        <h1>Accounts</h1>
        <p class="lede">Filter the workspace, select rows and run one action across them. Every bulk change writes an audit event with a before and after diff.</p>
      </div>
      <span class="spacer" />
      <button class="btn sm" type="button" @click="accountsStore.exportAccounts()">Export CSV</button>
    </div>

    <div class="card filter-bar">
      <label class="filter-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input v-model="query" class="input" type="search" placeholder="Search name, domain or owner" aria-label="Search accounts" />
      </label>
      <select v-model="planFilter" class="select" aria-label="Filter by plan">
        <option value="all">All plans</option>
        <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
      </select>
      <select v-model="statusFilter" class="select" aria-label="Filter by status">
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="trial">Trial</option>
        <option value="past_due">Past due</option>
        <option value="suspended">Suspended</option>
      </select>
      <select v-model="sortValue" class="select" aria-label="Sort accounts">
        <option value="name-asc">Name A to Z</option>
        <option value="name-desc">Name Z to A</option>
        <option value="mrr-desc">MRR high to low</option>
        <option value="mrr-asc">MRR low to high</option>
        <option value="seats-desc">Seats high to low</option>
        <option value="lastActive-desc">Last active newest</option>
      </select>
      <button v-if="hasFilters" class="btn ghost sm" type="button" @click="accountsStore.resetFilters()">Clear</button>
      <span class="filter-count">{{ filtered.total }} of {{ summary.total }} accounts</span>
    </div>

    <div class="card bulk-bar" :class="{ active: selectedCount > 0 }">
      <div class="bulk-summary">
        <template v-if="selectedCount > 0">
          <span class="bulk-count">{{ selectedCount }}</span>
          <b>selected</b>
          <span class="small muted">Apply one action to the selection</span>
        </template>
        <template v-else>
          <b>Bulk actions</b>
          <span class="small muted">Select accounts below to suspend, reactivate or change a plan</span>
        </template>
      </div>
      <div class="bulk-actions">
        <button id="bulk-suspend" class="btn sm" type="button" :disabled="selectedCount === 0" @click="bulkSuspend">Suspend</button>
        <button id="bulk-reactivate" class="btn sm" type="button" :disabled="selectedCount === 0" @click="bulkReactivate">Reactivate</button>
        <select id="bulk-plan" v-model="bulkPlan" class="select sm-select" :disabled="selectedCount === 0" aria-label="Bulk plan">
          <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
        </select>
        <button id="bulk-apply" class="btn primary sm" type="button" :disabled="selectedCount === 0" @click="bulkChangePlan">Change plan</button>
        <button v-if="selectedCount > 0" id="bulk-clear" class="btn ghost sm" type="button" @click="accountsStore.clearSelection()">Clear</button>
      </div>
    </div>

    <div class="accounts-layout">
      <div class="card table-card accounts-table-card">
        <div class="table-wrap">
          <table class="table accounts-table">
            <thead>
              <tr>
                <th class="check-col">
                  <input
                    type="checkbox"
                    class="check"
                    :checked="allVisibleSelected"
                    aria-label="Select all visible accounts"
                    @change="accountsStore.toggleVisible()"
                  />
                </th>
                <th>Account</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Seats</th>
                <th class="num">MRR</th>
                <th>Last active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="account in filtered.rows"
                :key="account.id"
                :class="{ 'row-active': account.id === activeAccountId }"
                @click="accountsStore.setActiveAccount(account.id)"
              >
                <td class="check-col" @click.stop>
                  <input
                    :id="`select-${account.id}`"
                    type="checkbox"
                    class="check"
                    :checked="accountsStore.isSelected(account.id)"
                    :aria-label="`Select ${account.name}`"
                    @change="accountsStore.toggleSelected(account.id)"
                  />
                </td>
                <td>
                  <div class="account-cell">
                    <span class="avatar sm">{{ initials(account.name) }}</span>
                    <div><b>{{ account.name }}</b><span>{{ account.domain }}</span></div>
                  </div>
                </td>
                <td><span class="plan-badge" :class="account.plan">{{ planName(plans, account.plan) }}</span></td>
                <td><StatusBadge :status="account.status" /></td>
                <td>
                  <div class="seat-cell">
                    <span>{{ account.seats }} / {{ capacityFor(account) }}</span>
                    <span class="mini-bar"><i :style="{ width: `${seatPercent(account)}%` }" /></span>
                  </div>
                </td>
                <td class="num mono">{{ formatCurrency(mrrFor(account)) }}</td>
                <td class="small muted nowrap">{{ relativeTime(account.lastActiveAt) }}</td>
                <td class="row-actions" @click.stop>
                  <button class="link-btn" type="button" @click="accountsStore.setActiveAccount(account.id)">Manage</button>
                </td>
              </tr>
              <tr v-if="filtered.rows.length === 0">
                <td colspan="8" class="empty-cell">No accounts match those filters.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="table-foot">
          <span>Showing {{ filtered.from }}, {{ filtered.to }} of {{ filtered.total }}</span>
          <span class="spacer" />
          <button class="btn ghost sm" type="button" :disabled="filtered.page <= 1" @click="go(filtered.page - 1)">Previous</button>
          <span class="page-chip">{{ filtered.page }} / {{ filtered.totalPages }}</span>
          <button class="btn ghost sm" type="button" :disabled="filtered.page >= filtered.totalPages" @click="go(filtered.page + 1)">Next</button>
        </div>
      </div>

      <aside v-if="activeAccount" class="card account-detail">
        <div class="detail-head">
          <span class="avatar lg">{{ initials(activeAccount.name) }}</span>
          <div class="detail-id">
            <h3>{{ activeAccount.name }}</h3>
            <span>{{ activeAccount.domain }}</span>
          </div>
          <StatusBadge :status="activeAccount.status" />
        </div>

        <div class="detail-grid">
          <div><span>Plan</span><b>{{ planName(plans, activeAccount.plan) }}</b></div>
          <div><span>MRR</span><b>{{ formatCurrency(mrrFor(activeAccount)) }}</b></div>
          <div><span>Seats</span><b>{{ activeAccount.seats }} / {{ capacityFor(activeAccount) }}</b></div>
          <div><span>Region</span><b>{{ activeAccount.region }}</b></div>
          <div><span>Owner</span><b>{{ activeAccount.owner }}</b></div>
          <div><span>Last active</span><b>{{ relativeTime(activeAccount.lastActiveAt) }}</b></div>
        </div>

        <div class="seat-block">
          <div><span>Seat usage</span><b>{{ formatPercent(activeAccount.seats / capacityFor(activeAccount)) }}</b></div>
          <div class="progress"><i :style="{ width: `${seatPercent(activeAccount)}%` }" /></div>
        </div>

        <div class="detail-actions">
          <button class="btn sm" type="button" @click="toggleActive">
            {{ activeAccount.status === "suspended" ? "Reactivate" : "Suspend" }}
          </button>
          <select v-model="detailPlan" class="select sm-select" aria-label="Change plan">
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">{{ plan.name }}</option>
          </select>
          <button class="btn primary sm" type="button" :disabled="detailPlan === activeAccount.plan" @click="applyDetailPlan">Change plan</button>
        </div>

        <div class="detail-audit">
          <div class="detail-audit-head">
            <h4>Recent activity</h4>
            <button class="link-btn" type="button" @click="accountsStore.setActiveAccount(null)">Close</button>
          </div>
          <div v-if="recentForActive.length" class="detail-events">
            <div v-for="event in recentForActive" :key="event.id" class="detail-event">
              <div class="detail-event-head">
                <b>{{ actionLabel(event.action) }}</b>
                <span class="small muted">{{ relativeTime(event.at) }}</span>
              </div>
              <DiffView :changes="event.changes" />
            </div>
          </div>
          <p v-else class="small muted detail-empty">No audit entries for this account yet.</p>
        </div>
      </aside>

      <aside v-else class="card account-detail detail-empty-card">
        <p class="small muted">Select a row to inspect an account.</p>
      </aside>
    </div>
  </section>
</template>
