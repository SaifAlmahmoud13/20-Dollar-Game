import { useEffect, useState } from 'react';
import { clamp } from '../lib/format.js';

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="knob" />
    </button>
  );
}

// A number you can type. While focused it shows plain digits; otherwise the formatted
// value (e.g. "$1,000,000"). Typed values are kept within [min, max].
export function NumberInput({ value, onChange, min = 0, max = Infinity, format = (v) => v.toLocaleString('en-US'), label, className = '', grow }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? format(value);
  return (
    <input
      style={grow ? { width: `calc(${Math.max(3, shown.length) + 1}ch + 20px)` } : undefined}
      className={`number-input ${className}`}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      value={shown}
      onFocus={(e) => {
        setDraft(String(value));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
        setDraft(digits);
        if (digits) onChange(clamp(Number(digits), min, max));
      }}
      onBlur={() => {
        if (draft === '' || Number(draft) < min) onChange(min);
        setDraft(null);
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}

export function Stepper({ value, onChange, min, max, step = 1, format, label }) {
  const stepBy = typeof step === 'function' ? step(value) : step;
  return (
    <div className="stepper">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - stepBy))}>
        −
      </button>
      <NumberInput grow className="stepper-value" value={value} onChange={onChange} min={min} max={max} format={format} label={label} />
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + stepBy))}>
        +
      </button>
    </div>
  );
}

export function TopBar({ onBack, title, right }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button type="button" className="icon-btn accent" aria-label="Back" onClick={onBack}>
          ←
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-right">{right ?? <span className="icon-spacer" />}</div>
    </header>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
