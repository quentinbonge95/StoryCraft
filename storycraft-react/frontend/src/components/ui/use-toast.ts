import * as React from 'react';
import {
  Toast as ToastPrimitive,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastTitle,
  ToastViewport,
  type ToastProps,
  type ToastActionProps,
  type ToastVariant,
} from './Toast';
import {
  ToastProvider as ToastProviderPrimitive,
  useToast as useToastPrimitive,
  type ToastData,
} from './ToastProvider';

export const Toast = ToastPrimitive;
export { ToastAction, ToastClose, ToastDescription, ToastTitle, ToastViewport };
export const ToastProvider = ToastProviderPrimitive;
export const useToast = useToastPrimitive;

// Re-export types for convenience
export type { ToastProps, ToastActionProps, ToastVariant, ToastData };

type ToastActionElement = React.ReactElement<ToastActionProps, typeof ToastAction>;
