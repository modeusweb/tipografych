"use client";

import { Modal } from "@/components/ui/Modal";

const SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "Что исправляется",
    items: [
      "Прямые и английские кавычки — на «ёлочки», вложенные — на „лапки“.",
      "Дефис с пробелами — на длинное тире, диапазоны чисел — на короткое тире.",
      "Лишние и недостающие пробелы вокруг знаков препинания, в скобках и кавычках.",
      "Три точки — на символ многоточия …, диапазон «10...12» — на «10…12».",
      "Знак процента пишется слитно с числом («50 %» → «50%»), дробная часть — через запятую («0.5 %» → «0,5%»).",
      "Единицы измерения: «10кг» → «10 кг», «1500м2» → «1500 м²», «Мбит / сек» → «Мбит/сек».",
      "Телефоны: «+7 ( 999 ) 123 - 45 - 67» → «+7 (999) 123-45-67».",
      "Запись температуры: «20 градусов Цельсия» → «20 °C».",
      "Неразрывные пробелы после предлогов, в инициалах, после № и §, между числом и единицей.",
      "Разделители разрядов в числах из 5+ цифр (в пресетах «Русская типографика» и «Издательская»).",
    ],
  },
  {
    title: "Что никогда не исправляется",
    items: [
      "URL, email и домены.",
      "Телефоны, даты, IP-адреса, версии ПО, имена файлов и флаги командной строки.",
      "Содержимое inline-кода и fenced-блоков, HTML-теги (обрабатывается только текст вокруг).",
      "Блоки кода с отступом в формате Markdown — вместе с отступами.",
      "Дефисы внутри слов, апострофы, десятичные дроби, годы и отрицательные числа.",
      "Смайлы ( :) :-( :( =( ) — пробел перед ними часть смайла.",
      "Числа с ведущим нулём (коды, артикулы) — они не разбиваются на разряды.",
      "Переводы строк и пустые строки — структура текста сохраняется.",
    ],
  },
  {
    title: "Как работают настройки",
    items: [
      "Пресет — готовый набор правил; любое правило можно отключить отдельно (пресет станет «Пользовательским»).",
      "Формат входных данных включает дополнительную защиту Markdown или HTML.",
      "Автообработка удобна для черновиков; для больших текстов лучше ручной режим.",
      "Изменение настроек вступает в силу при следующей обработке.",
    ],
  },
];

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Как работает Типографыч" wide>
      <div className="flex flex-col gap-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <p>
          Типографыч приводит русский текст к аккуратной типографике по
          детерминированным правилам: один и тот же текст с одними и теми же
          настройками всегда даёт один и тот же результат. Никакой внешней
          обработки текста нет.
        </p>
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="mb-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
              {section.title}
            </h3>
            <ul className="list-disc space-y-1 pl-5 marker:text-zinc-300 dark:marker:text-zinc-600">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <section>
          <h3 className="mb-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            Почему некоторые правила выключены по умолчанию
          </h3>
          <p>
            Если исправление может быть неоднозначным (например, разбивка
            длинных чисел на разряды), правило отключено в минимальном пресете:
            лучше не менять текст, чем рискнуть его испортить. Включить его
            можно в настройках.
          </p>
        </section>
        <section>
          <h3 className="mb-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            Приватность
          </h3>
          <p>
            Текст обрабатывается в вашем браузере и не отправляется на сервер.
            Сам текст нигде не сохраняется: в localStorage хранятся только
            настройки.
          </p>
        </section>
        <section>
          <h3 className="mb-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
            Горячие клавиши
          </h3>
          <p>
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Ctrl</kbd>
            {" + "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Enter</kbd>
            {" "}— типографировать ·{" "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Ctrl</kbd>
            {" + "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Shift</kbd>
            {" + "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">C</kbd>
            {" "}— скопировать результат ·{" "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">Ctrl</kbd>
            {" + "}
            <kbd className="rounded border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-600">A</kbd>
            {" "}— выделить содержимое панели «Результат», когда она в фокусе.
          </p>
        </section>
      </div>
    </Modal>
  );
}
