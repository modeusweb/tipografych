import {
  typograph,
  type TypographyOptions,
  type TypographResult,
} from "@/features/typography";
import { TYPOGRAPHY_CONFIG } from "@/features/typography/config";
import type {
  WorkerRequest,
  WorkerResponse,
} from "@/workers/typography.worker";

/**
 * Клиент Web Worker с прозрачным fallback на синхронную обработку.
 *
 * - тексты длиннее TYPOGRAPHY_CONFIG.workerThresholdChars уходят в
 *   Worker, чтобы интерфейс оставался отзывчивым;
 * - короткие тексты обрабатываются в микрозадаче без воркера;
 * - если Worker недоступен или упал, все запросы идут синхронно.
 */
class TypographerClient {
  private worker: Worker | null = null;
  private workerBroken = false;
  private pending = new Map<
    number,
    { resolve: (result: TypographResult) => void; reject: (error: Error) => void }
  >();
  private nextId = 1;

  private ensureWorker(): Worker | null {
    if (!TYPOGRAPHY_CONFIG.enableWebWorker) return null;
    if (typeof Worker === "undefined") return null;
    if (this.workerBroken) return null;
    if (this.worker) return this.worker;
    try {
      const worker = new Worker(
        new URL("../workers/typography.worker.ts", import.meta.url),
      );
      worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const pending = this.pending.get(response.id);
        if (!pending) return;
        this.pending.delete(response.id);
        if (response.ok) pending.resolve(response.result);
        else pending.reject(new Error(response.error));
      });
      worker.addEventListener("error", () => {
        this.workerBroken = true;
        this.worker?.terminate();
        this.worker = null;
        for (const pending of this.pending.values()) {
          pending.reject(new Error("worker-failed"));
        }
        this.pending.clear();
      });
      this.worker = worker;
      return worker;
    } catch {
      this.workerBroken = true;
      return null;
    }
  }

  process(text: string, options: TypographyOptions): Promise<TypographResult> {
    const worker =
      text.length >= TYPOGRAPHY_CONFIG.workerThresholdChars
        ? this.ensureWorker()
        : null;

    if (!worker) {
      return new Promise((resolve, reject) => {
        // setTimeout(0): даём браузеру отрисовать состояние «Обрабатываем…».
        setTimeout(() => {
          try {
            resolve(typograph(text, options));
          } catch {
            reject(new Error("processing-failed"));
          }
        }, 0);
      });
    }

    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      this.pending.set(id, { resolve, reject });
      const request: WorkerRequest = { id, type: "process", text, options };
      worker.postMessage(request);
    });
  }
}

export const typographer = new TypographerClient();
