import React from 'react';
import { inputBaseClass } from './FormInput'; // Assuming inputBaseClass is exported from FormInput

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  options: { value: string | number; label: string }[];
  selectClassName?: string;
  labelClassName?: string;
}

export default function FormSelect({
  label,
  id,
  options,
  selectClassName = "",
  labelClassName = "",
  ...props
}: FormSelectProps) {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium text-slate-700 ${labelClassName}`}>
        {label}
      </label>
      <div className="relative mt-1">
        <select
          id={id}
          className={`${inputBaseClass} appearance-none ${selectClassName}`} // Use inputBaseClass, add appearance-none
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
} 