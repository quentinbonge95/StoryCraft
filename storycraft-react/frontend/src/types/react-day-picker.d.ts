// src/types/react-day-picker.d.ts
import * as React from 'react';
import { DayPicker as OriginalDayPicker } from 'react-day-picker';
import "react-day-picker/style.css";


declare module 'react-day-picker' {
  export interface DayPickerProps {
    mode?: 'single';
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    initialFocus?: boolean;
    className?: string;
    classNames?: Record<string, string>;
    showOutsideDays?: boolean;
  }

  export interface DayPicker extends OriginalDayPicker {}
  export const DayPicker: React.FC<DayPickerProps>;
}