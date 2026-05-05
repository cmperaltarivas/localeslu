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
        className={`w-full flex items-center justify-between gap-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${small ? 'px-2 py-1.5 text-xs' : 'px-4 py-2.5'}`}
      >
        <span>{selected?.label || value}</span>
        <span className="text-gray-400 text-[10px]">{abierto ? '▲' : '▼'}</span>
      </button>
      {abierto && (
        <div className="absolute z-[100] mt-1 w-full min-w-[120px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setAbierto(false); }}
              className={`w-full text-left px-3 py-2 ${small ? 'text-xs' : 'text-sm'} hover:bg-gray-50 transition-colors ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
            >
              {opt.value === value && '✓ '}{opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}