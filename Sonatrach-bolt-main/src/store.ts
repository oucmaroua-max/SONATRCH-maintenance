import { workOrders as seed } from '@/data';
import { isFeedbackApproved, type WorkFeedback, type WorkOrder } from '@/types';

const STORAGE_KEY = 'sonatrach-work-orders';

function load(): WorkOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw) as WorkOrder[];
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(seed);
    return seed.map((item) => {
      const saved = parsed.find((entry) => entry.id === item.id);
      return saved ? { ...item, ...saved } : structuredClone(item);
    });
  } catch {
    return structuredClone(seed);
  }
}

let orders = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeWorkOrders(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWorkOrders() {
  return orders;
}

export function getWorkOrder(id: string) {
  return orders.find((order) => order.id === id);
}

export function updateWorkOrder(id: string, patch: Partial<WorkOrder>) {
  orders = orders.map((order) => (order.id === id ? { ...order, ...patch } : order));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  emit();
}

export function addWorkFeedback(id: string, feedback: WorkFeedback) {
  const order = getWorkOrder(id);
  if (!order) return;
  const approved = isFeedbackApproved(feedback.decision);
  const reviewNote = `[Feedback ${feedback.role} — ${feedback.decision}] ${feedback.comment}`;
  updateWorkOrder(id, {
    feedbacks: [...(order.feedbacks ?? []), feedback],
    archived: approved,
    status: approved ? 'Terminé' : 'En cours',
    progress: approved ? 100 : Math.min(order.progress || 100, 80),
    observation: approved ? order.observation : [order.observation, reviewNote].filter(Boolean).join('\n\n'),
  });
}
