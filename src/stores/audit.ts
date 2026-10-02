import { computed, ref } from "vue";
import type { AuditChange, AuditEvent } from "../lib/admin-core.ts";
import { seedAudit } from "../data/seed.ts";

const DEMO_NOW = "2026-10-29T12:00:00Z";

const events = ref<AuditEvent[]>(seedAudit());
const query = ref("");
const actionFilter = ref("all");
const expandedId = ref<string | null>(events.value[0]?.id ?? null);
let sequence = 0;

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return events.value
    .filter((event) => {
      if (actionFilter.value !== "all" && event.action !== actionFilter.value) return false;
      if (!needle) return true;
      return `${event.actor} ${event.targetName} ${event.note || ""} ${event.action}`
        .toLowerCase()
        .includes(needle);
    })
    .slice()
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
});

const actions = computed(() => [...new Set(events.value.map((event) => event.action))].sort());

interface RecordInput {
  actor: string;
  action: string;
  targetType: "account" | "workspace";
  targetId: string;
  targetName: string;
  changes: AuditChange[];
  note?: string;
  at?: string;
}

function record(input: RecordInput): AuditEvent {
  sequence += 1;
  const event: AuditEvent = {
    id: `evt-live-${sequence}`,
    at: input.at || DEMO_NOW,
    actor: input.actor,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetName: input.targetName,
    changes: input.changes,
    note: input.note,
  };
  events.value = [event, ...events.value];
  expandedId.value = event.id;
  return event;
}

function toggleExpanded(id: string): void {
  expandedId.value = expandedId.value === id ? null : id;
}

function resetFilters(): void {
  query.value = "";
  actionFilter.value = "all";
}

export function useAudit() {
  return {
    events,
    query,
    actionFilter,
    expandedId,
    filtered,
    actions,
    record,
    toggleExpanded,
    resetFilters,
  };
}
