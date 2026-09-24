// Demo data. A fictional workspace with fifteen accounts, four usage metrics and
// an audit trail. Everything is deterministic so screenshots, tests and the
// numbers in the console stay in sync.

import type { Account, AuditEvent, Plan, UsageMetric } from "../lib/admin-core.ts";

export const SEED_PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    pricePerSeat: 29,
    seatLimit: 5,
    blurb: "One small team, one workspace.",
    features: ["5 seats per account", "Core dashboards", "7-day audit retention"],
    trend: [1460, 1520, 1480, 1610, 1680, 1640, 1750, 1810, 1790, 1860, 1900, 1980],
  },
  {
    id: "growth",
    name: "Growth",
    pricePerSeat: 59,
    seatLimit: 25,
    blurb: "Cross-functional teams and shared reporting.",
    features: ["25 seats per account", "Custom roles", "90-day audit retention", "CSV exports"],
    trend: [7180, 7360, 7420, 7710, 7860, 8010, 8180, 8260, 8490, 8630, 8810, 9040],
  },
  {
    id: "scale",
    name: "Scale",
    pricePerSeat: 99,
    seatLimit: 100,
    blurb: "Large estates with compliance requirements.",
    features: ["100 seats per account", "SSO and SCIM", "1-year audit retention", "Priority support"],
    trend: [12600, 12840, 13180, 13360, 13720, 13940, 14210, 14580, 14820, 15160, 15480, 15920],
  },
];

const ACCOUNTS: Account[] = [
  {
    id: "acc-1001", name: "Northwind Coffee", domain: "northwind.coffee", owner: "Rhea Malhotra",
    plan: "growth", status: "active", seats: 18, region: "Kathmandu, NP",
    createdAt: "2025-03-14", lastActiveAt: "2026-10-29T10:35:00Z",
  },
  {
    id: "acc-1002", name: "Meridian Health", domain: "meridian.health", owner: "Dr. Anil Verma",
    plan: "scale", status: "active", seats: 64, region: "Bengaluru, IN",
    createdAt: "2024-11-02", lastActiveAt: "2026-10-29T09:58:00Z",
  },
  {
    id: "acc-1003", name: "Copperline Studio", domain: "copperline.studio", owner: "Tashi Dolma",
    plan: "starter", status: "active", seats: 4, region: "Thimphu, BT",
    createdAt: "2025-08-21", lastActiveAt: "2026-10-29T08:41:00Z",
  },
  {
    id: "acc-1004", name: "Atlas Freight", domain: "atlasfreight.logistics", owner: "Sunita Rai",
    plan: "growth", status: "trial", seats: 12, region: "Pokhara, NP",
    createdAt: "2026-10-19", lastActiveAt: "2026-10-28T17:12:00Z",
  },
  {
    id: "acc-1005", name: "Loom & Ledger", domain: "loomledger.finance", owner: "Bikash Adhikari",
    plan: "starter", status: "past_due", seats: 3, region: "Lalitpur, NP",
    createdAt: "2025-05-09", lastActiveAt: "2026-10-21T13:04:00Z",
  },
  {
    id: "acc-1006", name: "Kiteworks Labs", domain: "kiteworks.dev", owner: "Maya Chen",
    plan: "scale", status: "active", seats: 88, region: "Singapore, SG",
    createdAt: "2024-07-18", lastActiveAt: "2026-10-29T11:02:00Z",
  },
  {
    id: "acc-1007", name: "Fable & Co", domain: "fableandco.design", owner: "Ishan Gurung",
    plan: "growth", status: "active", seats: 21, region: "Kathmandu, NP",
    createdAt: "2025-01-27", lastActiveAt: "2026-10-29T07:45:00Z",
  },
  {
    id: "acc-1008", name: "Sundial Energy", domain: "sundial.energy", owner: "Priya Nair",
    plan: "growth", status: "trial", seats: 9, region: "Chennai, IN",
    createdAt: "2026-10-22", lastActiveAt: "2026-10-27T15:30:00Z",
  },
  {
    id: "acc-1009", name: "Paperplane", domain: "paperplane.press", owner: "Nima Sherpa",
    plan: "starter", status: "suspended", seats: 2, region: "Bhaktapur, NP",
    createdAt: "2025-02-11", lastActiveAt: "2026-10-08T10:20:00Z",
  },
  {
    id: "acc-1010", name: "Grainstore", domain: "grainstore.market", owner: "Anjali Shah",
    plan: "growth", status: "active", seats: 14, region: "Biratnagar, NP",
    createdAt: "2025-06-30", lastActiveAt: "2026-10-28T19:26:00Z",
  },
  {
    id: "acc-1011", name: "Helix Robotics", domain: "helixrobotics.io", owner: "Rohan Mehta",
    plan: "scale", status: "active", seats: 41, region: "Hyderabad, IN",
    createdAt: "2024-12-12", lastActiveAt: "2026-10-29T10:11:00Z",
  },
  {
    id: "acc-1012", name: "Riverbend Schools", domain: "riverbend.edu.np", owner: "Dechen Wangmo",
    plan: "starter", status: "active", seats: 5, region: "Dharan, NP",
    createdAt: "2025-09-04", lastActiveAt: "2026-10-28T14:02:00Z",
  },
  {
    id: "acc-1013", name: "Terraform Design", domain: "terraform.design", owner: "Aarav Joshi",
    plan: "starter", status: "trial", seats: 4, region: "Kathmandu, NP",
    createdAt: "2026-10-22", lastActiveAt: "2026-10-29T06:55:00Z",
  },
  {
    id: "acc-1014", name: "Beacon Legal", domain: "beaconlegal.law", owner: "Suman Karki",
    plan: "growth", status: "past_due", seats: 17, region: "Kathmandu, NP",
    createdAt: "2025-04-16", lastActiveAt: "2026-10-24T11:47:00Z",
  },
  {
    id: "acc-1015", name: "Quartz Analytics", domain: "quartz.analytics", owner: "Nisha Rao",
    plan: "scale", status: "trial", seats: 23, region: "Mumbai, IN",
    createdAt: "2026-10-26", lastActiveAt: "2026-10-29T08:08:00Z",
  },
];

const USAGE: UsageMetric[] = [
  {
    id: "api", label: "API requests", unit: "requests", current: 8_420_000, limit: 12_000_000,
    points: [4.1, 4.4, 4.2, 4.8, 5.1, 4.9, 5.4, 5.8, 5.5, 6.1, 6.4, 6.2, 6.8, 7.1, 7.4, 7.2, 7.9, 8.42],
  },
  {
    id: "storage", label: "Storage", unit: "GB", current: 412, limit: 800,
    points: [248, 258, 271, 282, 296, 305, 318, 329, 341, 350, 362, 371, 378, 388, 394, 401, 407, 412],
  },
  {
    id: "seats", label: "Active seats", unit: "seats", current: 336, limit: 520,
    points: [286, 291, 289, 298, 304, 301, 311, 318, 315, 322, 327, 324, 329, 333, 331, 335, 338, 336],
  },
  {
    id: "automations", label: "Automation runs", unit: "runs", current: 41_200, limit: 100_000,
    points: [21.4, 22.8, 23.1, 25.6, 26.2, 27.9, 28.4, 30.1, 31.8, 33.2, 34.6, 35.1, 36.8, 37.9, 38.4, 39.6, 40.5, 41.2],
  },
];

const AUDIT: AuditEvent[] = [
  {
    id: "evt-9001", at: "2026-10-29T09:12:00Z", actor: "Anika Rai", action: "account.plan_changed",
    targetType: "account", targetId: "acc-1002", targetName: "Meridian Health",
    changes: [{ field: "plan", label: "Plan", before: "Growth", after: "Scale" }],
    note: "Renewal call: moved to Scale after the SSO review.",
  },
  {
    id: "evt-9002", at: "2026-10-29T08:40:00Z", actor: "You", action: "account.suspended",
    targetType: "account", targetId: "acc-1009", targetName: "Paperplane",
    changes: [{ field: "status", label: "Status", before: "Active", after: "Suspended" }],
    note: "Invoice 90 days overdue, access paused after two reminders.",
  },
  {
    id: "evt-9003", at: "2026-10-28T17:24:00Z", actor: "Anika Rai", action: "account.reactivated",
    targetType: "account", targetId: "acc-1010", targetName: "Grainstore",
    changes: [{ field: "status", label: "Status", before: "Suspended", after: "Active" }],
    note: "Payment received; access restored.",
  },
  {
    id: "evt-9004", at: "2026-10-28T14:03:00Z", actor: "You", action: "account.created",
    targetType: "account", targetId: "acc-1015", targetName: "Quartz Analytics",
    changes: [
      { field: "plan", label: "Plan", before: ", ", after: "Scale" },
      { field: "seats", label: "Seats", before: ", ", after: "23" },
    ],
    note: "Trial provisioned from the partner referral queue.",
  },
  {
    id: "evt-9005", at: "2026-10-28T11:16:00Z", actor: "Sujal Bista", action: "member.invited",
    targetType: "workspace", targetId: "workspace", targetName: "Larkfield Studio",
    changes: [{ field: "role", label: "Role", before: "Member", after: "Admin" }],
    note: "Second finance admin for month-end close.",
  },
  {
    id: "evt-9006", at: "2026-10-27T16:42:00Z", actor: "Anika Rai", action: "workspace.limit_changed",
    targetType: "workspace", targetId: "workspace", targetName: "Larkfield Studio",
    changes: [{ field: "apiLimit", label: "API limit", before: "8M / month", after: "12M / month" }],
    note: "Scale accounts were hitting the shared ceiling on weekdays.",
  },
  {
    id: "evt-9007", at: "2026-10-27T10:05:00Z", actor: "You", action: "account.plan_changed",
    targetType: "account", targetId: "acc-1006", targetName: "Kiteworks Labs",
    changes: [{ field: "plan", label: "Plan", before: "Growth", after: "Scale" }],
  },
  {
    id: "evt-9008", at: "2026-10-26T09:30:00Z", actor: "Anika Rai", action: "account.suspended",
    targetType: "account", targetId: "acc-1005", targetName: "Loom & Ledger",
    changes: [{ field: "status", label: "Status", before: "Past due", after: "Suspended" }],
    note: "Paused after the third failed card attempt.",
  },
  {
    id: "evt-9009", at: "2026-10-23T09:10:00Z", actor: "Anika Rai", action: "account.plan_changed",
    targetType: "account", targetId: "acc-1004", targetName: "Atlas Freight",
    changes: [{ field: "plan", label: "Plan", before: "Starter", after: "Growth" }],
    note: "Trial upgraded after the dispatch team added their crew.",
  },
];

export function seedAccounts(): Account[] {
  return ACCOUNTS.map((account) => ({ ...account }));
}

export function seedPlans(): Plan[] {
  return SEED_PLANS.map((plan) => ({ ...plan, features: [...plan.features], trend: [...plan.trend] }));
}

export function seedUsage(): UsageMetric[] {
  return USAGE.map((metric) => ({ ...metric, points: [...metric.points] }));
}

export function seedAudit(): AuditEvent[] {
  return AUDIT.map((event) => ({ ...event, changes: event.changes.map((change) => ({ ...change })) }));
}
