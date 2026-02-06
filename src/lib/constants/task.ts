export const TASK_STATUS_VALUES = [
  "POSTED",
  "CLAIMED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
] as const;

export type TaskStatusValue = (typeof TASK_STATUS_VALUES)[number];

export const TASK_PRIORITY_VALUES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type TaskPriorityValue = (typeof TASK_PRIORITY_VALUES)[number];

export const TASK_SORT_VALUES = ["recent", "oldest", "priority"] as const;

export type TaskSortValue = (typeof TASK_SORT_VALUES)[number];

const TASK_STATUS_SET = new Set<string>(TASK_STATUS_VALUES);
const TASK_PRIORITY_SET = new Set<string>(TASK_PRIORITY_VALUES);
const TASK_SORT_SET = new Set<string>(TASK_SORT_VALUES);

export function isTaskStatus(value: string): value is TaskStatusValue {
  return TASK_STATUS_SET.has(value);
}

export function isTaskPriority(value: string): value is TaskPriorityValue {
  return TASK_PRIORITY_SET.has(value);
}

export function isTaskSort(value: string): value is TaskSortValue {
  return TASK_SORT_SET.has(value);
}
