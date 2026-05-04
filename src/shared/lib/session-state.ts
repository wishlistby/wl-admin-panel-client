import { useEffect, useMemo, useState } from 'react';

type InitialValue<T> = T | (() => T);

function resolveInitialValue<T>(initialValue: InitialValue<T>) {
  return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
}

export function useSessionState<T>(key: string, initialValue: InitialValue<T>) {
  const storageKey = useMemo(() => `wl-admin:${key}`, [key]);
  const [hasStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem(storageKey) !== null;
  });
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return resolveInitialValue(initialValue);
    }

    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) {
      return resolveInitialValue(initialValue);
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return resolveInitialValue(initialValue);
    }
  });

  useEffect(() => {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  function clear() {
    window.sessionStorage.removeItem(storageKey);
  }

  return [value, setValue, hasStoredValue, clear] as const;
}
