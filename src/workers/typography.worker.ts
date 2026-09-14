import { typograph } from "@/features/typography";
import type {
  TypographyOptions,
  TypographResult,
} from "@/features/typography/types";

/**
 * Web Worker для обработки больших текстов.
 *
 * Протокол простой: запрос с уникальным id, ответ с тем же id.
 * Все вычисления детерминированы и изолированы: упавший воркер
 * не блокирует основную обработку запроса.
 */

export interface WorkerRequest {
  id: number;
  type: "process";
  text: string;
  options: TypographyOptions;
}

export type WorkerResponse =
  | { id: number; ok: true; result: TypographResult }
  | { id: number; ok: false; error: string };

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const { id, text, options } = event.data;
  const post = (self as unknown as { postMessage: (data: WorkerResponse) => void })
    .postMessage;
  try {
    const result = typograph(text, options);
    post({ id, ok: true, result });
  } catch {
    // Ошибка обработки не роняет воркер, в ответе передаётся код ошибки.
    post({ id, ok: false, error: "processing-failed" });
  }
});