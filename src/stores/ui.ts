import { ref } from "vue";

export type ViewId = "overview" | "accounts" | "plans" | "audit";

export const VIEW_IDS: ViewId[] = ["overview", "accounts", "plans", "audit"];

export const VIEW_TITLES: Record<ViewId, string> = {
  overview: "Overview",
  accounts: "Accounts",
  plans: "Plans and usage",
  audit: "Audit log",
};

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

function viewFromHash(): ViewId {
  if (typeof window === "undefined") return "overview";
  const raw = window.location.hash.replace("#", "").split("?")[0];
  return (VIEW_IDS as string[]).includes(raw) ? (raw as ViewId) : "overview";
}

const view = ref<ViewId>(viewFromHash());
const toasts = ref<Toast[]>([]);
let toastId = 0;

function navigate(next: ViewId): void {
  view.value = next;
  if (typeof window !== "undefined" && window.location.hash !== `#${next}`) {
    window.history.replaceState(null, "", `#${next}`);
  }
}

function syncFromHash(): void {
  const next = viewFromHash();
  if (next !== view.value) view.value = next;
}

function toast(message: string, tone: Toast["tone"] = "success"): void {
  toastId += 1;
  const id = toastId;
  toasts.value = [...toasts.value, { id, message, tone }];
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((entry) => entry.id !== id);
  }, 3200);
}

function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((entry) => entry.id !== id);
}

export function useUi() {
  return { view, toasts, navigate, syncFromHash, toast, dismissToast };
}
