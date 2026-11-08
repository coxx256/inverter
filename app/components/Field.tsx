export type FieldProps = {
  label: string;
  name: string;
  type?: string;
  list?: string;
  className?: string;
  inputMode?: "text" | "decimal" | "numeric" | "tel";
};

export function Field({
  label,
  name,
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
        list={list}
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}
