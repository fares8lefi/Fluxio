import { Check, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StepVerify({ email, code, onCodeChange, onSubmit, loading }) {
  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <span className="grid size-11 place-items-center rounded-xl bg-cyan-100 text-cyan-800">
        <MailCheck className="size-5" />
      </span>
      <div>
        <h2 className="text-2xl font-semibold">Vérifiez votre email</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Saisissez le code reçu à l'adresse <strong>{email}</strong>.
        </p>
      </div>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">
        Code de vérification
        <input
          required
          inputMode="numeric"
          maxLength={4}
          pattern="[0-9]{4}"
          value={code}
          onChange={(event) =>
            onCodeChange(event.target.value.replace(/\D/g, ''))
          }
          className="h-12 rounded-lg border border-slate-200 text-center text-lg font-semibold tracking-[.5em] outline-none focus:border-cyan-700 focus:ring-3 focus:ring-cyan-100"
          placeholder="0000"
        />
      </label>
      <Button
        disabled={loading}
        className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900"
        type="submit"
      >
        {loading ? (
          'Vérification…'
        ) : (
          <>
            <Check /> Vérifier mon compte
          </>
        )}
      </Button>
    </form>
  );
}
