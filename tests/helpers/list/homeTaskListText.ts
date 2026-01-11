//tests/helpers/list/homeTaskListText.ts
export function extractTaskCoordsFromText(text: string): {
  longitude: number;
  latitude: number;
} | null {
  // UI text example:
  // "Subject: OCP | Priority: 4 | Due-Date: 1/7/2026 | Cords: 34.78, 32.08"
  const m = /Cords:\s*([-\d.]+)\s*,\s*([-\d.]+)/i.exec(text);
  if (!m) return null;

  const longitude = Number(m[1]);
  const latitude = Number(m[2]);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { longitude, latitude };
}

export function extractSubjectFromText(text: string): string | null {
  const m = /Subject:\s*([^|]+)/i.exec(text);
  if (!m) return null;
  return m[1].trim() || null;
}

export function extractPriorityFromText(text: string): number | null {
  const m = /Priority:\s*(\d+)/i.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}
