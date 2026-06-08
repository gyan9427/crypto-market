import { InteractionManager } from 'react-native';

type Priority = 'critical' | 'high' | 'normal' | 'low';

type Task = { priority: Priority; run: () => Promise<void> | void };

const queue: Task[] = [];
let draining = false;

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function drain(): void {
  if (draining || queue.length === 0) return;
  draining = true;
  queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  const task = queue.shift();
  if (!task) {
    draining = false;
    return;
  }
  Promise.resolve(task.run()).finally(() => {
    draining = false;
    if (queue.length > 0) drain();
  });
}

export function enqueueBackgroundTask(
  priority: Priority,
  run: () => Promise<void> | void
): void {
  if (queue.length >= 20 && priority === 'low') return;
  queue.push({ priority, run });
  if (priority === 'critical' || priority === 'high') {
    drain();
    return;
  }
  InteractionManager.runAfterInteractions(() => drain());
}
