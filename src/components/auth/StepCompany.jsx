import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/auth/FormInput';

export function StepCompany({ data, onChange, onBack, onSubmit, loading }) {
  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Votre entreprise</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ces informations serviront à créer votre espace isolé.
        </p>
      </div>
      <FormInput
        required
        label="Nom de l'entreprise"
        name="company_name"
        value={data.company_name}
        onChange={onChange}
      />
      <FormInput
        required
        label="Matricule fiscal"
        name="matriculeFiscale"
        value={data.matriculeFiscale}
        onChange={onChange}
      />
      <div className="mt-2 flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft /> Retour
        </Button>
        <Button
          disabled={loading}
          className="h-11 flex-1 bg-cyan-800 hover:bg-cyan-900"
          type="submit"
        >
          {loading ? 'Envoi…' : 'Recevoir mon code'}
        </Button>
      </div>
    </form>
  );
}
