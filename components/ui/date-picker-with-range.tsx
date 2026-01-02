"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined
  setDate: (dateRange: DateRange | undefined) => void
  disabled?: boolean
  numberOfMonths?: number
}

const DatePickerWithRange = React.forwardRef<
  HTMLDivElement,
  DatePickerWithRangeProps
>(
  (
    { className, dateRange, setDate, disabled, numberOfMonths = 2, ...props },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("grid gap-2", className)} {...props}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
              disabled={disabled}
              aria-label="Pick a date range"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            data-slot="popover-content"
            className="w-auto p-0"
            align="start"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDate}
              numberOfMonths={numberOfMonths}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)
DatePickerWithRange.displayName = "DatePickerWithRange"

export default DatePickerWithRange
