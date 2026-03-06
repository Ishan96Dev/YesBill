'use client'
﻿// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
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
 * Clicking the month/year header cycles through days → months → years picker modes.
 * Value and onChange use Date objects. Use strToDate / dateToStr helpers for YYYY-MM-DD form state.
 */
export function DatePicker({ value, onChange, placeholder = "Select date", minDate, maxDate, className }) {
  const today = React.useMemo(() => new Date(), []);
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(value?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(value?.getMonth() ?? today.getMonth());
  // pickerMode: 'days' | 'months' | 'years'
  const [pickerMode, setPickerMode] = React.useState('days');
  const [yearRangeStart, setYearRangeStart] = React.useState(
    () => (value?.getFullYear() ?? today.getFullYear()) - 5
  );

  // Sync view when value changes externally
  React.useEffect(() => {
    if (value) {
      setViewYear(value.getFullYear());
      setViewMonth(value.getMonth());
    }
  }, [value]);

  // Reset picker mode when popover closes
  React.useEffect(() => {
    if (!open) setPickerMode('days');
  }, [open]);

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

          {pickerMode === 'days' ? (
            <>
              {/* Days mode: prev / clickable "Month Year" header / next */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" type="button" className="h-8 w-8 rounded-lg" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => { setYearRangeStart(viewYear - 5); setPickerMode('months'); }}
                  className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  {MONTH_NAMES[viewMonth]} {viewYear}
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                </button>
                <Button variant="ghost" size="icon" type="button" className="h-8 w-8 rounded-lg" onClick={handleNextMonth}>
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
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-8 w-8" />
                ))}
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
            </>
          ) : pickerMode === 'months' ? (
            <>
              {/* Months mode: clickable year → enters years mode */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setPickerMode('years')}
                  className="flex items-center gap-1 text-sm font-bold text-gray-900 hover:text-primary px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {viewYear}
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMode('days')}
                  className="text-xs text-gray-400 hover:text-gray-700 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MONTH_NAMES.map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setViewMonth(idx); setPickerMode('days'); }}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-semibold transition-all",
                      idx === viewMonth
                        ? "bg-primary text-white shadow-sm shadow-primary/25"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Years mode: paged 12-year grid */}
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" type="button" className="h-7 w-7 rounded-lg"
                  onClick={() => setYearRangeStart((s) => s - 12)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs font-semibold text-gray-600">
                  {yearRangeStart} – {yearRangeStart + 11}
                </span>
                <Button variant="ghost" size="icon" type="button" className="h-7 w-7 rounded-lg"
                  onClick={() => setYearRangeStart((s) => s + 12)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setViewYear(y); setPickerMode('months'); }}
                    className={cn(
                      "py-2 px-1 rounded-xl text-xs font-semibold transition-all",
                      y === viewYear
                        ? "bg-primary text-white shadow-sm shadow-primary/25"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Clear button — only in days mode */}
          {pickerMode === 'days' && value && (
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
