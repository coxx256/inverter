export type FieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  list?: string;
  className?: string;
  inputMode?: "text" | "decimal" | "numeric" | "tel";
};

export function Field({
  label,
  name,
  placeholder,
  type = "text",
  list,
  className = "",
  inputMode,
}: FieldProps) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        list={list}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}
