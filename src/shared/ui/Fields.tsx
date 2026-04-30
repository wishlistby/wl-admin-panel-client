import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  trailing?: React.ReactNode;
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

export function TextField({ label, hint, error, className, trailing, ...props }: TextFieldProps) {
  return (
    <label className={`field ${className ?? ''}`}>
      <span>{label}</span>
      <div className="input-wrap">
        <input className="input" {...props} />
        {trailing}
      </div>
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function TextAreaField({ label, hint, error, className, ...props }: TextAreaProps) {
  return (
    <label className={`field ${className ?? ''}`}>
      <span>{label}</span>
      <textarea className="textarea" {...props} />
      {hint && !error && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function SelectField({ label, hint, error, className, options, ...props }: SelectFieldProps) {
  return (
    <label className={`field ${className ?? ''}`}>
      <span>{label}</span>
      <select className="select" {...props}>
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

export function CheckboxField({ label, hint, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="checkbox">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}
