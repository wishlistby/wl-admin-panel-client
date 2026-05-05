import { Link, useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';

interface TabsProps {
  items: Array<{
    id: string;
    label: string;
    count?: number;
    help?: {
      short: string;
      sectionId: string;
      linkLabel?: string;
    };
  }>;
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ items, activeId, onChange }: TabsProps) {
  const location = useLocation();

  return (
    <div className="tabs">
      {items.map((item) => (
        <div key={item.id} className={`tab ${activeId === item.id ? 'is-active' : ''}`}>
          <button type="button" className="tab-main" onClick={() => onChange(item.id)}>
            <span>{item.label}</span>
            {item.count !== undefined && <small>{item.count}</small>}
          </button>

          {item.help && (
            <span className="field-help tab-help">
              <button type="button" className="field-help-trigger" aria-label={`Подсказка для вкладки ${item.label}`}>
                <CircleHelp size={14} />
              </button>
              <span className="field-help-popover" role="tooltip">
                <strong>{item.label}</strong>
                <span>{item.help.short}</span>
                <Link
                  to={`/?section=${encodeURIComponent(item.help.sectionId)}&returnTo=${encodeURIComponent(location.pathname)}`}
                >
                  {item.help.linkLabel ?? 'Открыть подробный раздел'}
                </Link>
              </span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
