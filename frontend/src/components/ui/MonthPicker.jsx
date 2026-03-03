// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Month picker with calendar-style popover (year + month grid).
 * Value and onChange use Date (first day of month); parent can convert to "YYYY-MM" if needed.
 */
export function MonthPicker({ value, onChange, placeholder = "Select month", className }) {
  const [selectedDate, setSelectedDate] = React.useState(value);
  const [currentYear, setCurrentYear] = React.useState(
    value?.getFullYear() ?? new Date().getFullYear()
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setSelectedDate(value);
    if (value) setCurrentYear(value.getFullYear());
  }, [value]);

  const handleMonthSelect = (monthIndex) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    setSelectedDate(newDate);
    onChange?.(newDate);
    setOpen(false);
  };

  const handlePreviousYear = () => setCurrentYear((prev) => prev - 1);
  const handleNextYear = () => setCurrentYear((prev) => prev + 1);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-[50px] px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
            !selectedDate && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-5 w-5 text-gray-500" />
          {selectedDate ? format(selectedDate, "MMMM yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handlePreviousYear}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold text-gray-900">{currentYear}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={handleNextYear}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((month, index) => {
              const isSelected =
                selectedDate &&
                selectedDate.getMonth() === index &&
                selectedDate.getFullYear() === currentYear;
              return (
                <Button
                  key={month}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className="h-9 text-sm font-normal rounded-lg"
                  onClick={() => handleMonthSelect(index)}
                >
                  {month.slice(0, 3)}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default MonthPicker;
