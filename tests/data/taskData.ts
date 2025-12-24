// tests/data/taskData.ts
export type BasicTaskData = {
  name: string;
  priority: number;
  subject: string;
  date: string;
};

export function formatDateMDY(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

export function futureDateMDY(daysAhead = 2): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatDateMDY(d);
}

export function buildUniqueTask(prefix: string): BasicTaskData {
  const rawSuffix =
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  const maxSuffixLen = Math.max(4, 30 - prefix.length - 1);
  const suffix = rawSuffix.slice(0, maxSuffixLen);

  const name = `${prefix} ${suffix}`;

  return {
    name,
    priority: 4,
    subject: "OCP",
    date: futureDateMDY(2),
  };
}
