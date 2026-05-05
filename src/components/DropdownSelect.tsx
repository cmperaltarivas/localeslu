'use client';

import { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export default function DropdownSelect({ value, onChange, options, className = '' }: Props) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    if (abierto) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [abierto]);

  const selected = options.find(o => o.value === value);
  const small = className.includes('text-xs') || className.includes('text-sm');

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full flex items-center justify-between gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-sm text-[var(--fg)] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] ${small ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5'}`}
      >
        <span>{selected?.label || value}</span>
        <svg className={`w-3.5 h-3.5 text-[var(--muted-light)] transition-transform ${abierto ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {abierto && (
        <div className="absolute z-[100] mt-1 w-full min-w-[120px] bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setAbierto(false); }}
              className={`w-full text-left px-3 py-2.5 ${small ? 'text-xs' : 'text-sm'} hover:bg-[var(--bg)] transition-colors ${opt.value === value ? 'text-[var(--primary)] font-medium bg-[var(--primary)]/6' : 'text-[var(--fg)]'}`}
            >
              {opt.value === value && (
                <svg className="w-3.5 h-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}