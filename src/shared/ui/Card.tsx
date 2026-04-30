import type { PropsWithChildren } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Card({ title, description, actions, className, children }: PropsWithChildren<CardProps>) {
  return (
    <section className={clsx('card', className)}>
      {(title || description || actions) && (
        <header className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}
