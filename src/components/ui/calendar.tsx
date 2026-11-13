"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/src/lib/utils";

// Calendar no padrão shadcn, utilizando o React DayPicker.
function Calendar({
  className,
  classNames,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays
      className={cn("p-3 text-sm", className)}
      classNames={{
        ...defaults,
        months: "flex flex-col gap-4",
        month: "space-y-3",
        month_caption: "relative flex min-h-8 items-center justify-center",
        caption_label: "text-xs font-medium",
        nav: "absolute top-0 right-0 flex items-center gap-1",
        button_previous:
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30",
        button_next:
          "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-30",
        chevron: "size-4",
        dropdowns: "flex items-center justify-center gap-1 text-xs font-medium",
        dropdown_root: "relative rounded-md px-2 py-1 hover:bg-accent",
        dropdown: "absolute inset-0 z-10 w-full cursor-pointer opacity-0",
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7",
        weekday: "flex h-8 w-9 items-center justify-center text-[11px] font-normal text-muted-foreground",
        weeks: "flex flex-col gap-1",
        week: "grid grid-cols-7",
        day: "relative size-9 p-0 text-center text-xs",
        day_button:
          "inline-flex size-9 items-center justify-center rounded-md font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary/90",
        today: "[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-primary/40",
        outside: "text-muted-foreground/40",
        disabled: "pointer-events-none opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeftIcon {...chevronProps} />
          ) : (
            <ChevronRightIcon {...chevronProps} />
          ),
        ...props.components,
      }}
      {...props}
    />
  );
}

export { Calendar };
