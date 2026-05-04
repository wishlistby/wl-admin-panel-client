import { useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { getFieldDoc } from '@/features/dashboard/docs/fieldDocs';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  trailing?: React.ReactNode;
  docKey?: string;
}

interface TextFieldProps extends FieldProps, InputHTMLAttributes<HTMLInputElement> {}
interface TextAreaProps extends FieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}
interface SelectFieldProps extends FieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>;
}
interface CheckboxFieldProps extends FieldProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

function FieldHelp({ label, docKey, anchorId }: { label: string; docKey?: string; anchorId: string }) {
  const location = useLocation();
  const doc = getFieldDoc(docKey, label);

  if (!doc) {
    return null;
  }

  const returnTo = `${location.pathname}${location.search}#${anchorId}`;
  const overviewHref = `/?section=${encodeURIComponent(doc.sectionId)}&field=${encodeURIComponent(doc.key)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <span className="field-help">
      <button type="button" className="field-help-trigger" aria-label={`Подсказка для поля ${label}`}>
        <CircleHelp size={14} />
      </button>
      <span className="field-help-popover" role="tooltip">
        <strong>{doc.label}</strong>
        <span>{doc.short}</span>
        <Link to={overviewHref}>Открыть подробный раздел</Link>
      </span>
    </span>
  );
}

function FieldLabel({ label, docKey, anchorId }: { label: string; docKey?: string; anchorId: string }) {
  return (
    <span className="field-label-row">
      <span>{label}</span>
      <FieldHelp label={label} docKey={docKey} anchorId={anchorId} />
    </span>
  );
}

export function TextField({ label, hint, error, className, trailing, docKey, id, ...props }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `field-${autoId.replace(/:/g, '')}`;

  return (
    <label id={`${fieldId}-anchor`} className={`field ${className ?? ''}`}>
      <FieldLabel label={label} docKey={docKey} anchorId={`${fieldId}-anchor`} />
      <div className="input-wrap">
        <input id={fieldId} className="input" {...props} />
        {trailing}
      </div>
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function TextAreaField({ label, hint, error, className, docKey, id, ...props }: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? `field-${autoId.replace(/:/g, '')}`;

  return (
    <label id={`${fieldId}-anchor`} className={`field ${className ?? ''}`}>
      <FieldLabel label={label} docKey={docKey} anchorId={`${fieldId}-anchor`} />
      <textarea id={fieldId} className="textarea" {...props} />
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function SelectField({ label, hint, error, className, options, docKey, id, ...props }: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `field-${autoId.replace(/:/g, '')}`;

  return (
    <label id={`${fieldId}-anchor`} className={`field ${className ?? ''}`}>
      <FieldLabel label={label} docKey={docKey} anchorId={`${fieldId}-anchor`} />
      <select id={fieldId} className="select" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function CheckboxField({ label, hint, checked, onChange, docKey }: CheckboxFieldProps) {
  const autoId = useId();
  const fieldId = `field-${autoId.replace(/:/g, '')}`;

  return (
    <label id={`${fieldId}-anchor`} className="checkbox">
      <input id={fieldId} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <span className="field-label-row">
          <strong>{label}</strong>
          <FieldHelp label={label} docKey={docKey} anchorId={`${fieldId}-anchor`} />
        </span>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}
