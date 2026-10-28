export function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  ...props
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-950 transition outline-none placeholder:text-slate-400 read-only:bg-slate-50 read-only:text-slate-600 focus:border-cyan-700 focus:ring-3 focus:ring-cyan-100 aria-invalid:border-rose-400"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <span className="text-xs font-normal text-rose-700">{error}</span>}
    </label>
  );
}
