interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
  }
  
  export default function FormInput({ label, ...props }: FormInputProps) {
    return (
      <div>
        {label && <label className="block text-sm font-medium mb-1">{label}</label>}
        <input
          {...props}
          className="border px-3 py-2 rounded w-full"
        />
      </div>
    );
  }