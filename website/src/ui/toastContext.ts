import { createContext, useContext } from 'react';

export type ToastTone = 'neutral' | 'ok' | 'bad';
export interface ToastInput { title: string; description?: string; tone?: ToastTone; /** ms; 0 keeps it until dismissed */ duration?: number }
export type ToastFn = (t: ToastInput) => void;

/** Outside a ToastProvider the hook is a no-op, so primitives can call it unconditionally. */
export const ToastContext = createContext<ToastFn>(() => {});

/** `const toast = useToast(); toast({ title: 'Citation copied', tone: 'ok' })` */
export const useToast = () => useContext(ToastContext);
