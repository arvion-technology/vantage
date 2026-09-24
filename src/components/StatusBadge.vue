<script setup lang="ts">
import { statusLabel } from "../lib/admin-core.ts";
import type { AccountStatus } from "../lib/admin-core.ts";

defineProps<{ status: AccountStatus }>();
</script>

<template>
  <span class="status-badge" :class="status">
    <span class="dot" />
    {{ statusLabel(status) }}
  </span>
</template>
