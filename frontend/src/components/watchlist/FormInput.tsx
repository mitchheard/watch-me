import { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  }
  
const inputBaseClass = "border border-slate-300 px-3 py-2 rounded-md w-full text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow";

// Use forwardRef to allow passing refs to the input element
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, className, ...props }, ref) => {
    return (
      <div>
        <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
          {label}
        </label>
        <input
          id={id}
          ref={ref} // Assign the ref to the actual input element
          {...props}
          className={`${inputBaseClass} ${className || ''}`}
        />
      </div>
    );
  }
);

FormInput.displayName = 'FormInput'; // Optional: for better debugging

export default FormInput;