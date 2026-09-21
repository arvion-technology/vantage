<script setup lang="ts">
import type { AuditChange } from "../lib/admin-core.ts";

defineProps<{ changes: AuditChange[] }>();
</script>

<template>
  <div class="diff">
    <div v-for="change in changes" :key="change.field" class="diff-row">
      <span class="diff-label">{{ change.label }}</span>
      <span class="diff-before">{{ change.before }}</span>
      <svg class="diff-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12h14" /><path d="m14 7 5 5-5 5" />
      </svg>
      <span class="diff-after">{{ change.after }}</span>
    </div>
  </div>
</template>
