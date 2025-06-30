import { DateRange } from "react-day-picker";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function DatePickerWithRange({
    className,
    dateRange,
    setDate,
    disabled,
}: React.HTMLAttributes<HTMLDivElement> & {
    dateRange: DateRange | undefined;
    setDate: (date: DateRange) => void;
    disabled?: boolean;
}) {
    const [internalDateRange, setInternalDateRange] = useState<
        DateRange | undefined
    >(dateRange);

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover
                onOpenChange={() => {
                    setDate(internalDateRange as DateRange);
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground",
                            disabled && "opacity-50 cursor-not-allowed",
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon />
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
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        autoFocus={true}
                        mode="range"
                        defaultMonth={internalDateRange?.from}
                        selected={internalDateRange}
                        onSelect={date =>
                            setInternalDateRange(date as DateRange)
                        }
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
