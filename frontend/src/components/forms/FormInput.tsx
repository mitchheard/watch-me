import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

const inputBaseClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none leading-normal"; // Removed invalid: classes, reverted to py-2

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>((
  { label, id, type = "text", className, inputClassName = "", labelClassName = "", ...restProps },
  ref
) => {
  return (
    <div className={className}>
      <label htmlFor={id} className={`block text-sm font-medium text-slate-700 ${labelClassName}`}>
        {label}
      </label>
      <input
        type={type}
        id={id}
        ref={ref}
        className={[inputBaseClass, inputClassName].filter(Boolean).join(' ')}
        {...restProps}
      />
    </div>
  );
});

FormInput.displayName = 'FormInput';

export { inputBaseClass }; // Exporting for use in FormSelect or other components
export default FormInput; 