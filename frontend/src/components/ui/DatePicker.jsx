// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Day-level date picker with calendar popover.
 * Value and onChange use Date objects. Use strToDate / dateToStr helpers for YYYY-MM-DD form state.
 */
export function DatePicker({ value, onChange, placeholder = "Select date", minDate, maxDate, className }) {
  const today = React.useMemo(() => new Date(), []);
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(value?.getMonth() ?? today.getMonth());

  // Sync view when value changes externally
  React.useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayClick = (day) => {
    const selected = new Date(viewYear, viewMonth, day);
    onChange?.(selected);
    setOpen(false);
  };

  const isSelected = (day) =>
    value &&
    value.getFullYear() === viewYear &&
    value.getMonth() === viewMonth &&
    value.getDate() === day;

  const isTodayDay = (day) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn(
            "w-full justify-start text-left font-normal h-[46px] px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
            !value && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />
          {value ? format(value, "d MMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl" align="start">
        <div className="p-3 w-[280px]">
          {/* Month + year navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-lg"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-lg"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Padding empty cells for first week */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} className="h-8 w-8" />
            ))}

            {/* Day buttons */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const sel = isSelected(day);
              const tod = isTodayDay(day);
              const dis = isDisabled(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={dis}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all mx-auto font-normal",
                    sel && "bg-primary text-white font-semibold shadow-sm",
                    !sel && tod && "ring-2 ring-amber-400 ring-offset-1 text-amber-600 font-medium",
                    !sel && !tod && !dis && "hover:bg-gray-100 text-gray-800",
                    dis && "opacity-30 cursor-not-allowed text-gray-400"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onChange?.(null); setOpen(false); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 py-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear date
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** YYYY-MM-DD string → Date (midnight local time, avoids UTC off-by-one) */
export const strToDate = (s) => (s ? new Date(s + "T00:00:00") : null);

/** Date → YYYY-MM-DD string */
export const dateToStr = (d) => {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default DatePicker;
