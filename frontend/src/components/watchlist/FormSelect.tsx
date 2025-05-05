interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
  }
  
  export default function FormSelect({ label, options, ...props }: FormSelectProps) {
    return (
      <div>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <select {...props} className="border px-3 py-2 rounded w-full">
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }
  