export const PROJECT_STATUS_VALUES = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUS_VALUES)[number];

export const PROJECT_SORT_VALUES = ["recent", "popular"] as const;

export type ProjectSortValue = (typeof PROJECT_SORT_VALUES)[number];

const PROJECT_STATUS_SET = new Set<string>(PROJECT_STATUS_VALUES);
const PROJECT_SORT_SET = new Set<string>(PROJECT_SORT_VALUES);

export function isProjectStatus(value: string): value is ProjectStatusValue {
  return PROJECT_STATUS_SET.has(value);
}

export function isProjectSort(value: string): value is ProjectSortValue {
  return PROJECT_SORT_SET.has(value);
}
