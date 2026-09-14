import { TYPOGRAPHY_CONFIG } from "./config";

/**
 * Попроизводительный diff для режима «Показать изменения».
 *
 * Алгоритм — Myers O(ND) на строках: для реалистичных текстов
 * (небольшое число отличий) работает быстро; если тексты слишком
 * велики или слишком сильно различаются, diff отключается — вместо
 * него UI показывает сводку изменений из статистики движка.
 */

export type DiffRowType = "equal" | "removed" | "added";

export interface DiffRow {
  type: DiffRowType;
  text: string;
}

export interface InlinePart {
  text: string;
  changed: boolean;
}

/**
 * Построчный diff. Возвращает null, если тексты слишком велики
 * (больше TYPOGRAPHY_CONFIG.diffMaxLines строк) или различаются
 * сильнее, чем позволяет лимит расстояния.
 */
export function diffLines(before: string, after: string): DiffRow[] | null {
  if (before === after) return [];
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;
  if (n + m > TYPOGRAPHY_CONFIG.diffMaxLines) return null;

  const offset = n + m;
  const v = new Int32Array(2 * offset + 1);
  const maxD = TYPOGRAPHY_CONFIG.diffMaxDistance;
  const trace: Int32Array[] = [];
  let found = false;

  for (let d = 0; d <= maxD; d++) {
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[k - 1 + offset] < v[k + 1 + offset])) {
        x = v[k + 1 + offset];
      } else {
        x = v[k - 1 + offset] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[k + offset] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
    const window = new Int32Array(2 * d + 1);
    for (let kk = -d; kk <= d; kk++) window[kk + d] = v[kk + offset];
    trace.push(window);
    if (found) break;
  }

  if (!found) return null;

  const ops: DiffRow[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const win = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && win[k - 1 + d] < win[k + 1 + d])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = win[prevK + d];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push({ type: "equal", text: a[x - 1] });
      x -= 1;
      y -= 1;
    }
    if (d > 0) {
      if (x === prevX) ops.push({ type: "added", text: b[prevY] });
      else ops.push({ type: "removed", text: a[prevX] });
    }
    x = prevX;
    y = prevY;
  }
  ops.reverse();
  return ops;
}

/**
 * Внутристроковое сравнение пары строк: выделяет общее начало/конец
 * и отмечает изменённую середину. Возвращает null для одинаковых строк.
 */
export function inlineDiffParts(
  removed: string,
  added: string,
): { removed: InlinePart[]; added: InlinePart[] } | null {
  if (removed === added) return null;
  let prefix = 0;
  const maxPrefix = Math.min(removed.length, added.length);
  while (prefix < maxPrefix && removed[prefix] === added[prefix]) prefix += 1;
  let suffix = 0;
  const maxSuffix = Math.min(removed.length - prefix, added.length - prefix);
  while (
    suffix < maxSuffix &&
    removed[removed.length - 1 - suffix] === added[added.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const head = prefix > 0 ? removed.slice(0, prefix) : "";
  const tail = suffix > 0 ? removed.slice(removed.length - suffix) : "";
  const removedMid = removed.slice(prefix, removed.length - suffix);
  const addedMid = added.slice(prefix, added.length - suffix);
  return {
    removed: [
      ...(head ? [{ text: head, changed: false }] : []),
      { text: removedMid, changed: true },
      ...(tail ? [{ text: tail, changed: false }] : []),
    ],
    added: [
      ...(head ? [{ text: head, changed: false }] : []),
      { text: addedMid, changed: true },
      ...(tail ? [{ text: tail, changed: false }] : []),
    ],
  };
}
