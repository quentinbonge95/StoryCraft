import * as React from 'react';
import {
  Toast,
  ToastViewport as ToastViewportComponent,
  ToastVariant,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewportProps
} from './Toast';

export const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  (props, ref) => <ToastViewportComponent ref={ref} {...props} />
);

ToastViewport.displayName = 'ToastViewport';

export type ToastData = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  action?: React.ReactNode;
};

type ToastContextType = {
  toasts: ToastData[];
  toast: (props: Omit<ToastData, 'id'>) => { id: string; dismiss: () => void };
  dismissToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((props: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((currentToasts) => [{ ...props, id }, ...currentToasts].slice(0, 3));
    
    const timer = setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
    }, 5000);

    return {
      id,
      dismiss: () => {
        clearTimeout(timer);
        setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
      },
    };
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const value = React.useMemo(
    () => ({
      toasts,
      toast,
      dismissToast,
    }),
    [toasts, toast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport>
        {toasts.map(({ id, title, description, action, variant = 'default' }) => (
          <Toast key={id} variant={variant}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose onClick={() => dismissToast(id)} />
          </Toast>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
