// src/components/ui/calendar.tsx
import * as React from "react"
import { DayPicker as BaseDayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"

// Import styles
import "react-day-picker/dist/style.css"

// Extend the DayPicker props to include our custom props
type CalendarProps = React.ComponentProps<typeof BaseDayPicker> & {
  className?: string
}

function Calendar({
  className,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-4 bg-white rounded-lg shadow-lg", className)}>
      <BaseDayPicker
        className="m-0 p-0"
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
