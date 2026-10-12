<script setup lang="ts">
import { computed } from "vue";
import { formatCompact, formatCurrency, formatPercent } from "../lib/admin-core.ts";
import type { UsageMetric } from "../lib/admin-core.ts";
import { useAccounts } from "../stores/accounts.ts";
import Sparkline from "../components/Sparkline.vue";

const { planCards, usageCards, summary } = useAccounts();

const metricValue = (metric: UsageMetric): string => {
  if (metric.id === "storage") return `${metric.current} GB`;
  if (metric.id === "seats") return `${metric.current} seats`;
  return `${formatCompact(metric.current)} ${metric.unit}`;
};

const utilisationTone = computed(() => (
  summary.value.utilisation > 0.8 ? "red" : summary.value.utilisation > 0.6 ? "gold" : ""
));
</script>

<template>
  <section class="view plans-view">
    <div class="page-head">
      <div>
        <div class="eyebrow">Packaging</div>
        <h1>Plans and usage</h1>
        <p class="lede">Three seat-based plans. Revenue, allocation and usage are computed from the same account and usage stores the rest of the console reads.</p>
      </div>
      <span class="spacer" />
      <span class="badge" :class="utilisationTone">{{ formatPercent(summary.utilisation) }} seats in use</span>
    </div>

    <div class="grid grid-3 plan-grid plan-grid-lg">
      <div v-for="card in planCards" :key="card.plan.id" class="card plan-card plan-card-lg">
        <div class="plan-card-head">
          <span class="plan-dot" :class="card.plan.id" />
          <b>{{ card.plan.name }}</b>
          <span class="spacer" />
          <span class="plan-price">{{ formatCurrency(card.plan.pricePerSeat) }}<small>/seat/mo</small></span>
        </div>
        <p class="plan-blurb">{{ card.plan.blurb }}</p>
        <ul class="feature-list">
          <li v-for="feature in card.plan.features" :key="feature">{{ feature }}</li>
        </ul>
        <Sparkline :values="card.plan.trend" :width="280" :height="56" :tone="card.plan.id === 'scale' ? 'green' : card.plan.id === 'growth' ? 'cobalt' : 'amber'" />
        <div class="plan-card-stats">
          <div><span>MRR</span><b>{{ formatCurrency(card.mrr) }}</b></div>
          <div><span>Accounts</span><b>{{ card.accounts }}</b></div>
          <div><span>Seats</span><b>{{ card.seats }} / {{ card.capacity }}</b></div>
        </div>
        <div class="progress" style="margin-top: 10px"><i :style="{ width: `${Math.round(card.utilisation * 100)}%` }" /></div>
        <div class="plan-share">
          <span class="small muted">{{ formatPercent(card.mrrShare) }} of recurring revenue</span>
          <span class="small muted">{{ formatPercent(card.utilisation) }} seat utilisation</span>
        </div>
      </div>
    </div>

    <div class="section-head">
      <div>
        <h2>Usage this cycle</h2>
        <p class="small muted">Samples are seeded; the current and limit values come from the same usage store shown on the overview.</p>
      </div>
    </div>

    <div class="grid grid-4 usage-grid">
      <div v-for="card in usageCards" :key="card.metric.id" class="card usage-tile">
        <div class="usage-tile-head">
          <span class="stat-label">{{ card.metric.label }}</span>
          <span class="badge" :class="card.summary.percent > 0.8 ? 'red' : card.summary.percent > 0.6 ? 'gold' : ''">
            {{ formatPercent(card.summary.percent) }}
          </span>
        </div>
        <div class="usage-tile-value">{{ metricValue(card.metric) }}</div>
        <Sparkline :values="card.metric.points" :width="180" :height="44" :tone="card.summary.percent > 0.8 ? 'amber' : 'cobalt'" />
        <div class="progress" style="margin-top: 8px"><i :style="{ width: `${Math.round(card.summary.percent * 100)}%` }" /></div>
        <div class="usage-tile-foot">
          <span>Limit {{ formatCompact(card.metric.limit) }}</span>
          <span :class="card.summary.deltaPct >= 0 ? 'up' : 'down'">
            {{ card.summary.deltaPct >= 0 ? "+" : "" }}{{ formatPercent(card.summary.deltaPct) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
