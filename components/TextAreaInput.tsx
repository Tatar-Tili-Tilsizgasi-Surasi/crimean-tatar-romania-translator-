
import React from 'react';

interface TextAreaInputProps {
  id: string;
  value: string;
  onChange?: (text: string) => void;
  placeholder: string;
  readOnly?: boolean;
  className?: string;
  rows?: number;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  readOnly = false,
  className = '',
  rows = 6,
}) => {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readOnly}
      rows={rows}
      className={`w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-white placeholder-slate-400 resize-y transition duration-150 ease-in-out ${readOnly ? 'cursor-default bg-slate-700/70' : ''} ${className}`}
    />
  );
};

export default TextAreaInput;
