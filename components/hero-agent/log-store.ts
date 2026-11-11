// A typewriter log kept outside React state, read through useSyncExternalStore.
// Lines queue up and type out one at a time; low priority lines are dropped when
// the queue is backed up so live events never lag far behind the visitor.

export type LogTag = "observe" | "detect" | "reason" | "act";

export type LogEntry = {
  id: number;
  tag: LogTag;
  text: string;
  atMs: number;
  shown: number;
};

type Pending = {
  tag: LogTag;
  text: string;
  onStart?: () => void;
};

type PushOptions = {
  onStart?: () => void;
  // Live lines describe the present moment; they are skipped rather than delayed.
  live?: boolean;
};

const TICK_MS = 16;
const CHARS_PER_TICK = 2;
const GAP_TICKS = 6;
const MAX_LIVE_BACKLOG = 1;

export function createLogStore(maxLines: number) {
  let entries: LogEntry[] = [];
  let queue: Pending[] = [];
  let nextId = 0;
  let gap = 0;
  let instant = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  const startedAt = Date.now();
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const append = (pending: Pending) => {
    pending.onStart?.();
    const entry: LogEntry = {
      id: nextId++,
      tag: pending.tag,
      text: pending.text,
      atMs: Date.now() - startedAt,
      shown: instant ? pending.text.length : 0,
    };
    entries = [...entries, entry].slice(-maxLines);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const tick = () => {
    const last = entries[entries.length - 1];
    if (last && last.shown < last.text.length) {
      entries = [...entries.slice(0, -1), { ...last, shown: last.shown + CHARS_PER_TICK }];
      emit();
      return;
    }
    if (queue.length === 0) return stop();
    if (gap++ < GAP_TICKS) return;
    gap = 0;
    const [head, ...rest] = queue;
    queue = rest;
    append(head);
    emit();
  };

  return {
    push(tag: LogTag, text: string, options: PushOptions = {}) {
      if (options.live && queue.length > MAX_LIVE_BACKLOG) return;
      const pending = { tag, text, onStart: options.onStart };
      if (instant) {
        append(pending);
        emit();
        return;
      }
      queue = [...queue, pending];
      timer ??= setInterval(tick, TICK_MS);
    },
    setInstant(value: boolean) {
      instant = value;
    },
    reset() {
      stop();
      entries = [];
      queue = [];
      gap = 0;
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => entries,
  };
}

export type LogStore = ReturnType<typeof createLogStore>;
