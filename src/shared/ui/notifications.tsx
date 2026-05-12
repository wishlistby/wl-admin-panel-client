import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type NotificationItem = {
  id: string;
  type: 'error' | 'success';
  title: string;
  message: string;
};

type NotificationListener = (items: NotificationItem[]) => void;

const listeners = new Set<NotificationListener>();
let notifications: NotificationItem[] = [];

function emit() {
  for (const listener of listeners) {
    listener(notifications);
  }
}

function pushNotification(type: NotificationItem['type'], title: string, message: string) {
  const item: NotificationItem = {
    id: crypto.randomUUID(),
    type,
    title,
    message,
  };

  notifications = [item, ...notifications].slice(0, 5);
  emit();

  window.setTimeout(() => {
    notifications = notifications.filter((entry) => entry.id !== item.id);
    emit();
  }, 6500);
}

export function pushErrorNotification(title: string, message: string) {
  pushNotification('error', title, message);
}

export function pushSuccessNotification(title: string, message: string) {
  pushNotification('success', title, message);
}

export function dismissNotification(id: string) {
  notifications = notifications.filter((item) => item.id !== id);
  emit();
}

export function NotificationViewport() {
  const [items, setItems] = useState<NotificationItem[]>(notifications);

  useEffect(() => {
    const listener: NotificationListener = (next) => setItems(next);
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="notification-stack" aria-live="assertive" aria-atomic="true">
      {items.map((item) => (
        <article key={item.id} className={`notification-card notification-card-${item.type}`} role="alert">
          <div className="notification-icon">
            {item.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div className="notification-copy">
            <strong>{item.title}</strong>
            <p>{item.message}</p>
          </div>
          <button type="button" className="notification-close" aria-label="Закрыть уведомление" onClick={() => dismissNotification(item.id)}>
            <X size={16} />
          </button>
        </article>
      ))}
    </div>
  );
}
