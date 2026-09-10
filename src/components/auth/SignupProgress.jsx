export function SignupProgress({ currentStep, steps }) {
  return (
    <div
      className="flex justify-between gap-2"
      aria-label="Étapes d’inscription"
    >
      {steps.map((label, index) => (
        <div className="flex-1" key={label}>
          <div
            className={`h-1 rounded-full ${index + 1 <= currentStep ? 'bg-cyan-700' : 'bg-slate-100'}`}
          />
          <p
            className={`mt-2 text-xs ${index + 1 === currentStep ? 'font-semibold text-cyan-800' : 'text-slate-400'}`}
          >
            {index + 1}. {label}
          </p>
        </div>
      ))}
    </div>
  );
}
