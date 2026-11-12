"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import type * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const buttonClassNames =
  "relative flex size-(--cell-size) text-base sm:text-sm items-center justify-center rounded-lg text-[var(--tx-primary)] not-in-data-selected:hover:bg-[var(--sf-overlay)] disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  mode = "single",
  ...props
}: React.ComponentProps<typeof DayPicker>): React.ReactElement {
  const defaultClassNames = {
    button_next: cn(buttonClassNames, "border border-[var(--border-default)] bg-[var(--sf-overlay)] hover:bg-[var(--sf-raised)] w-8 h-8"),
    button_previous: cn(buttonClassNames, "border border-[var(--border-default)] bg-[var(--sf-overlay)] hover:bg-[var(--sf-raised)] w-8 h-8"),
    caption_label:
      "text-base sm:text-sm font-medium flex items-center gap-2 h-full text-[var(--tx-primary)]",
    day: "size-(--cell-size) text-sm py-px",
    day_button: cn(
      buttonClassNames,
      "in-data-disabled:pointer-events-none in-[.range-middle]:rounded-none in-[.range-end:not(.range-start)]:rounded-s-none in-[.range-start:not(.range-end)]:rounded-e-none in-[.range-middle]:in-data-selected:bg-[var(--accent-subtle)] in-data-selected:bg-[var(--accent)] in-[.range-middle]:in-data-selected:text-[var(--tx-primary)] in-data-disabled:text-[var(--tx-muted)] in-data-outside:text-[var(--tx-muted)] in-data-selected:in-data-outside:text-[var(--accent-fg)] in-data-selected:text-[var(--accent-fg)] in-data-disabled:line-through outline-none in-[[data-selected]:not(.range-middle)]:transition-[color,background-color,border-radius] focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
    ),
    dropdown: "absolute bg-[var(--sf-raised)] inset-0 opacity-0",
    dropdown_root:
      "relative has-focus:border-[var(--accent)] has-focus:ring-[var(--accent-subtle)] has-focus:ring-2 border border-[var(--border-default)] rounded-lg px-[calc(--spacing(3)-1px)] h-9 sm:h-8 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-me-1",
    dropdowns:
      "w-full flex items-center text-base sm:text-sm justify-center h-(--cell-size) gap-1.5 *:[span]:font-medium text-[var(--tx-primary)]",
    hidden: "invisible",
    month: "w-full",
    month_caption:
      "relative mx-(--cell-size) px-1 mb-1 flex h-(--cell-size) items-center justify-center z-2",
    months: "relative flex flex-col sm:flex-row gap-2 bg-[var(--sf-raised)] border border-[var(--border-default)] rounded-xl p-3",
    nav: "absolute top-3 flex w-[calc(100%-24px)] justify-between z-1",
    outside:
      "text-[var(--tx-muted)] data-selected:bg-[var(--accent-subtle)] data-selected:text-[var(--tx-secondary)]",
    range_end: "range-end",
    range_middle: "range-middle",
    range_start: "range-start",
    today:
      "*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-1 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-[var(--accent)] [&[data-selected]:not(.range-middle)>*]:after:bg-[var(--accent-fg)] [&[data-disabled]>*]:after:bg-[var(--tx-muted)] *:after:transition-colors bg-[var(--sf-overlay)] rounded-lg",
    week_number:
      "size-(--cell-size) p-0 text-xs font-medium text-[var(--tx-muted)]",
    weekday:
      "size-(--cell-size) p-0 text-xs font-medium text-[var(--tx-muted)] flex justify-center items-center",
    weekdays: "flex w-full",
    weeks: "flex flex-col w-full gap-1",
    week: "flex w-full",
    month_grid: "w-full border-collapse",
  };

  const mergedClassNames: typeof defaultClassNames = Object.keys(
    defaultClassNames,
  ).reduce(
    (acc, key) => {
      const userClass = classNames?.[key as keyof typeof classNames];
      const baseClass =
        defaultClassNames[key as keyof typeof defaultClassNames];

      acc[key as keyof typeof defaultClassNames] = userClass
        ? cn(baseClass, userClass)
        : baseClass;

      return acc;
    },
    { ...defaultClassNames } as typeof defaultClassNames,
  );

  const defaultComponents = {
    Chevron: ({
      className,
      orientation,
      ...props
    }: {
      className?: string;
      orientation?: "left" | "right" | "up" | "down";
    }): React.ReactElement => {
      if (orientation === "left") {
        return (
          <ChevronLeftIcon
            className={cn(className, "rtl:rotate-180")}
            {...props}
            aria-hidden="true"
          />
        );
      }

      if (orientation === "right") {
        return (
          <ChevronRightIcon
            className={cn(className, "rtl:rotate-180")}
            {...props}
            aria-hidden="true"
          />
        );
      }

      return (
        <ChevronsUpDownIcon
          className={className}
          {...props}
          aria-hidden="true"
        />
      );
    },
  };

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  };

  const dayPickerProps = {
    className: cn(
      "w-fit [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(9)]",
      className,
    ),
    classNames: mergedClassNames,
    components: mergedComponents,
    "data-slot": "calendar",
    formatters: {
      formatMonthDropdown: (date: Date) =>
        date.toLocaleString("default", { month: "short" }),
    } as React.ComponentProps<typeof DayPicker>["formatters"],
    mode,
    showOutsideDays,
    ...props,
  };

  return (
    <DayPicker
      {...(dayPickerProps as React.ComponentProps<typeof DayPicker>)}
    />
  );
}
