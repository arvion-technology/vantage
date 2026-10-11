<script setup lang="ts">
import { computed, ref } from "vue";
import { formatCurrency, formatCompact, formatPercent } from "../lib/admin-core.ts";
import type { UsageMetric } from "../lib/admin-core.ts";
import { useAccounts } from "../stores/accounts.ts";
import { useUi } from "../stores/ui.ts";
import Sparkline from "../components/Sparkline.vue";

const { summary, planCards, usageCards, usage } = useAccounts();
const ui = useUi();

const activeMetricId = ref<string>(usage.value[0]?.id || "api");
const activeMetric = computed<UsageMetric>(() => (
  usage.value.find((metric) => metric.id === activeMetricId.value) || usage.value[0]
));
const activeSummary = computed(() => (
  usageCards.value.find((entry) => entry.metric.id === activeMetric.value.id)?.summary
  || { percent: 0, deltaPct: 0, last: 0, peak: 0 }
));

const mrrSeries = computed(() => {
  const series: number[] = [];
  for (const card of planCards.value) {
    card.plan.trend.forEach((value, index) => {
      series[index] = (series[index] || 0) + value;
    });
  }
  return series;
});

const metricValue = (metric: UsageMetric): string => {
  if (metric.id === "storage") return `${metric.current} GB`;
  if (metric.id === "seats") return `${metric.current} seats`;
  return `${formatCompact(metric.current)} ${metric.unit}`;
};
</script>

<template>
  <section class="view overview-view">
    <div class="page-head">
      <div>
        <div class="eyebrow">Workspace</div>
        <h1>Overview</h1>
        <p class="lede">Fifteen demo accounts, three plans and a fixed audit trail. Every number on this page is derived from the stores.</p>
      </div>
      <span class="spacer" />
      <div class="row">
        <button class="btn sm" type="button" @click="ui.navigate('audit')">Open audit log</button>
        <button class="btn primary sm" type="button" @click="ui.navigate('accounts')">Manage accounts</button>
      </div>
    </div>

    <div class="grid grid-4 kpi-grid">
      <div class="card kpi-card">
        <div class="kpi-top">
          <span class="stat-label">Monthly recurring</span>
          <span class="badge green"><span class="dot" />live</span>
        </div>
        <div class="stat-value">{{ formatCurrency(summary.mrr) }}</div>
        <div class="kpi-foot">
          <span class="small muted">{{ summary.payingAccounts }} paying accounts · {{ formatCurrency(summary.arr) }} ARR</span>
          <Sparkline :values="mrrSeries" :width="120" :height="32" tone="green" />
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-top"><span class="stat-label">Active accounts</span><span class="badge">{{ summary.total }} total</span></div>
        <div class="stat-value">{{ summary.active }}</div>
        <div class="kpi-foot">
          <span class="small muted">{{ summary.trial }} trials · {{ summary.suspended }} suspended</span>
          <span class="kpi-chip">{{ summary.newThisMonth }} new this month</span>
        </div>
      </div>

      <div class="card kpi-card">
        <div class="kpi-top"><span class="stat-label">Seat utilisation</span><span class="badge">{{ formatPercent(summary.utilisation) }}</span></div>
        <div class="stat-value">{{ summary.seatsUsed }}<small class="stat-unit"> / {{ summary.seatCapacity }}</small></div>
        <div class="progress" style="margin-top: 9px"><i :style="{ width: `${Math.round(summary.utilisation * 100)}%` }" /></div>
        <div class="kpi-foot"><span class="small muted">Seats provisioned across non-suspended accounts</span></div>
      </div>

      <div class="card kpi-card kpi-warn">
        <div class="kpi-top"><span class="stat-label">Needs attention</span><span class="badge red">{{ summary.atRisk }}</span></div>
        <div class="stat-value">{{ summary.atRisk }}</div>
        <div class="kpi-foot">
          <span class="small muted">{{ summary.pastDue }} past due · {{ summary.trial }} trials to convert</span>
          <button class="link-btn" type="button" @click="ui.navigate('accounts')">Review</button>
        </div>
      </div>
    </div>

    <div class="overview-split">
      <div class="card usage-card">
        <div class="card-head">
          <div>
            <div class="card-title">Usage this cycle</div>
            <div class="card-sub">Rolling sample of the last 18 days</div>
          </div>
          <span class="spacer" />
          <div class="metric-tabs" role="tablist" aria-label="Usage metric">
            <button
              v-for="card in usageCards"
              :key="card.metric.id"
              class="metric-tab"
              :class="{ active: card.metric.id === activeMetricId }"
              type="button"
              role="tab"
              :aria-selected="card.metric.id === activeMetricId"
              @click="activeMetricId = card.metric.id"
            >{{ card.metric.label }}</button>
          </div>
        </div>

        <div class="usage-main">
          <div>
            <div class="usage-value">{{ metricValue(activeMetric) }}</div>
            <div class="small muted">
              {{ formatPercent(activeSummary.percent) }} of {{ formatCompact(activeMetric.limit) }} {{ activeMetric.unit }}
              · <span :class="activeSummary.deltaPct >= 0 ? 'up' : 'down'">
                {{ activeSummary.deltaPct >= 0 ? "+" : "" }}{{ formatPercent(activeSummary.deltaPct) }}
              </span> vs sample start
            </div>
          </div>
          <span class="badge" :class="activeSummary.percent > 0.8 ? 'red' : activeSummary.percent > 0.6 ? 'gold' : ''">
            {{ formatPercent(activeSummary.percent) }} used
          </span>
        </div>

        <Sparkline :values="activeMetric.points" :width="560" :height="118" />

        <div class="usage-foot">
          <span>Peak {{ formatCompact(activeSummary.peak) }}</span>
          <span>Latest {{ formatCompact(activeSummary.last) }}</span>
          <span class="spacer" />
          <span class="mono">{{ activeMetric.id }}</span>
        </div>
      </div>

      <div class="card mix-card">
        <div class="card-head">
          <div>
            <div class="card-title">Plan mix</div>
            <div class="card-sub">Share of recurring revenue</div>
          </div>
        </div>
        <button
          v-for="card in planCards"
          :key="card.plan.id"
          class="mix-row"
          type="button"
          @click="ui.navigate('plans')"
        >
          <span class="mix-head">
            <span class="plan-dot" :class="card.plan.id" />
            <b>{{ card.plan.name }}</b>
            <span class="mix-mrr">{{ formatCurrency(card.mrr) }}</span>
          </span>
          <span class="mix-bar"><i :style="{ width: `${Math.round(card.mrrShare * 100)}%` }" :class="card.plan.id" /></span>
          <span class="mix-sub">{{ card.accounts }} accounts · {{ formatPercent(card.mrrShare) }} of MRR</span>
        </button>
        <div class="mix-foot">
          <span class="small muted">Updated from account seats</span>
          <button class="link-btn" type="button" @click="ui.navigate('plans')">All plans</button>
        </div>
      </div>
    </div>

    <div class="plan-grid">
      <div v-for="card in planCards" :key="card.plan.id" class="card plan-card">
        <div class="plan-card-head">
          <span class="plan-dot" :class="card.plan.id" />
          <b>{{ card.plan.name }}</b>
          <span class="spacer" />
          <span class="plan-price">{{ formatCurrency(card.plan.pricePerSeat) }}<small>/seat</small></span>
        </div>
        <div class="plan-card-value">
          {{ formatCurrency(card.mrr) }}
          <span class="small muted">MRR</span>
        </div>
        <Sparkline :values="card.plan.trend" :width="240" :height="46" :tone="card.plan.id === 'scale' ? 'green' : card.plan.id === 'growth' ? 'cobalt' : 'amber'" />
        <div class="plan-card-foot">
          <span>{{ card.accounts }} accounts</span>
          <span>{{ card.seats }} / {{ card.capacity }} seats</span>
        </div>
      </div>
    </div>

  </section>
</template>
