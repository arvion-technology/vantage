<script setup lang="ts">
import { computed } from "vue";
import { sparkline } from "../lib/admin-core.ts";

const props = withDefaults(defineProps<{
  values: number[];
  width?: number;
  height?: number;
  tone?: "cobalt" | "green" | "amber";
}>(), { width: 150, height: 40, tone: "cobalt" });

const geometry = computed(() => sparkline(props.values, props.width, props.height));
</script>

<template>
  <svg
    class="spark"
    :class="tone"
    :style="{ height: `${height}px` }"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <path :d="geometry.area" class="spark-area" />
    <path :d="geometry.line" class="spark-line" />
  </svg>
</template>
