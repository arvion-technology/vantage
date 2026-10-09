<script setup lang="ts">
import { computed } from "vue";
import { actionLabel, formatDate, relativeTime } from "../lib/admin-core.ts";
import { useAudit } from "../stores/audit.ts";
import DiffView from "../components/DiffView.vue";

const audit = useAudit();
const { filtered, query, actionFilter, actions, expandedId } = audit;

const hasFilters = computed(() => query.value !== "" || actionFilter.value !== "all");
const initials = (name: string): string => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
</script>

<template>
  <section class="view audit-view">
    <div class="page-head">
      <div>
        <div class="eyebrow">Accountability</div>
        <h1>Audit log</h1>
        <p class="lede">Every bulk action in the accounts view appends an event here. Expand a row to compare the field values before and after the change.</p>
      </div>
      <span class="spacer" />
      <span class="badge">{{ filtered.length }} events</span>
    </div>

    <div class="card filter-bar">
      <label class="filter-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input v-model="query" class="input" type="search" placeholder="Search actor, account or note" aria-label="Search audit log" />
      </label>
      <select v-model="actionFilter" class="select" aria-label="Filter by action">
        <option value="all">All actions</option>
        <option v-for="action in actions" :key="action" :value="action">{{ actionLabel(action) }}</option>
      </select>
      <button v-if="hasFilters" class="btn ghost sm" type="button" @click="audit.resetFilters()">Clear</button>
      <span class="filter-count">{{ filtered.length }} of {{ audit.events.value.length }} events</span>
    </div>

    <div class="card audit-card">
      <div class="card-head">
        <div>
          <div class="card-title">Workspace events</div>
          <div class="card-sub">Newest first · expand any row for the diff</div>
        </div>
        <span class="spacer" />
        <span class="mono small muted">fixed clock 2026-10-29</span>
      </div>

      <div class="audit-list">
        <div
          v-for="event in filtered"
          :key="event.id"
          class="audit-item"
          :class="{ open: expandedId === event.id }"
        >
          <button class="audit-summary" type="button" :aria-expanded="expandedId === event.id" @click="audit.toggleExpanded(event.id)">
            <span class="avatar sm">{{ initials(event.actor) }}</span>
            <span class="audit-text"><b>{{ event.actor }}</b> {{ actionLabel(event.action) }} <b>{{ event.targetName }}</b></span>
            <span class="badge" :class="event.targetType === 'workspace' ? 'blue' : ''">{{ event.targetType }}</span>
            <span class="audit-change-count">{{ event.changes.length }} field{{ event.changes.length === 1 ? "" : "s" }}</span>
            <span class="audit-time">{{ relativeTime(event.at) }}</span>
            <svg class="audit-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <p v-if="event.note" class="audit-note">{{ event.note }}</p>
          <div v-if="expandedId === event.id" class="audit-diff">
            <DiffView :changes="event.changes" />
            <div class="audit-meta">
              <span class="mono">{{ event.id }}</span>
              <span>{{ formatDate(event.at) }}</span>
              <span>{{ event.targetId }}</span>
            </div>
          </div>
        </div>

        <div v-if="filtered.length === 0" class="empty-state">
          <b>No events match those filters.</b>
          <span>Clear the search or pick another action.</span>
        </div>
      </div>
    </div>
  </section>
</template>
