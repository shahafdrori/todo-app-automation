//tests/utils/taskData.ts
export type BasicTaskData = {
  name: string;
  priority: number;
  subject: string;
  date: string;
};

/**
 * Create a unique task payload so tests don't clash across projects/browsers,
 * while keeping `name` length <= 30 (backend validation rule).
 */
export function buildUniqueTask(prefix: string): BasicTaskData {
  // raw unique suffix: timestamp + random
  const rawSuffix =
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  // max length we can use for the suffix: 30 (limit) - prefix - 1 space
  const maxSuffixLen = Math.max(4, 30 - prefix.length - 1);
  const suffix = rawSuffix.slice(0, maxSuffixLen);

  const name = `${prefix} ${suffix}`;

  return {
    name,
    priority: 4,
    subject: "OCP",
    date: "12/06/2025",
  };
}
