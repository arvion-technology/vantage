<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import type { Component } from "vue";
import OverviewView from "./views/OverviewView.vue";
import AccountsView from "./views/AccountsView.vue";
import PlansView from "./views/PlansView.vue";
import AuditView from "./views/AuditView.vue";
import { VIEW_TITLES, useUi } from "./stores/ui.ts";
import type { ViewId } from "./stores/ui.ts";
import { useAccounts } from "./stores/accounts.ts";
import { useAudit } from "./stores/audit.ts";

const ui = useUi();
const accounts = useAccounts();
const audit = useAudit();

const views: Record<ViewId, Component> = {
  overview: OverviewView,
  accounts: AccountsView,
  plans: PlansView,
  audit: AuditView,
};

const currentView = computed(() => views[ui.view.value]);
const currentTitle = computed(() => VIEW_TITLES[ui.view.value]);

const nav = [
  { id: "overview", label: "Overview" },
  { id: "accounts", label: "Accounts" },
  { id: "plans", label: "Plans and usage" },
  { id: "audit", label: "Audit log" },
] as const;

onMounted(() => window.addEventListener("hashchange", ui.syncFromHash));
onBeforeUnmount(() => window.removeEventListener("hashchange", ui.syncFromHash));
</script>

<template>
  <div class="app shell vantage-shell">
    <aside class="sidebar vantage-sidebar">
      <div class="brand vantage-brand">
        <span class="brand-mark">A</span>
        <span>
          <span class="brand-word">ARVION <b>/</b> VANTAGE</span>
          <span class="brand-sub" style="display: block">Admin console</span>
        </span>
      </div>

      <div class="workspace-chip">
        <span class="avatar sm lilac">LS</span>
        <span><b>Larkfield Studio</b><span>Growth workspace</span></span>
      </div>

      <div class="nav-label">Manage</div>
      <a
        v-for="item in nav"
        :key="item.id"
        :id="`nav-${item.id}`"
        class="nav-item"
        :class="{ active: ui.view.value === item.id }"
        :href="`#${item.id}`"
        @click.prevent="ui.navigate(item.id)"
      >
        <svg v-if="item.id === 'overview'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
        <svg v-else-if="item.id === 'accounts'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3" /><path d="M4 19c0-3 2.2-5 5-5s5 2 5 5" /><path d="M16 6.5a3 3 0 0 1 0 5.8" /><path d="M17 14.2c2 .6 3 2.3 3 4.8" /></svg>
        <svg v-else-if="item.id === 'plans'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5-8 4.5-8-4.5z" /><path d="m4 12 8 4.5 8-4.5" /><path d="m4 16.5 8 4.5 8-4.5" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3.5 2" /></svg>
        {{ item.label }}
        <span v-if="item.id === 'accounts'" class="nav-badge mono">{{ accounts.summary.value.total }}</span>
        <span v-if="item.id === 'audit'" class="nav-badge mono">{{ audit.events.value.length }}</span>
      </a>

      <div style="flex: 1" />

      <div class="sidebar-card card flat pad-sm">
        <span class="avatar">AR</span>
        <span class="sidebar-card-text"><b>Aarav Rana</b><span>Workspace admin</span></span>
      </div>
      <p class="sidebar-foot small muted">Demo data · fixed clock<br />Stores reset on reload.</p>
    </aside>

    <div class="vantage-main">
      <header class="topbar vantage-topbar">
        <span class="crumb">Admin <span class="crumb-sep">/</span> <b>{{ currentTitle }}</b></span>
        <span class="spacer" />
        <span class="badge blue">demo data</span>
        <span class="badge green"><span class="dot pulse" />stores live</span>
        <span class="top-divider" />
        <div class="avatar lilac" title="Workspace operator">AR</div>
      </header>

      <main class="main vantage-body">
        <component :is="currentView" :key="ui.view.value" />
      </main>
    </div>

    <div class="toast-host" aria-live="polite">
      <div
        v-for="entry in ui.toasts.value"
        :key="entry.id"
        class="toast"
        :class="entry.tone"
        @click="ui.dismissToast(entry.id)"
      >
        <span class="dot" />
        <span>{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>
