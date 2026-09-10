import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/auth/FormInput';

export function StepPersonal({ data, onChange, onNext }) {
  return (
    <form
      className="mt-7 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (event.currentTarget.reportValidity()) onNext();
      }}
    >
      <div>
        <h2 className="text-2xl font-semibold">Vos informations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Commençons par créer votre profil.
        </p>
      </div>
      <FormInput
        required
        label="Nom complet"
        name="username"
        value={data.username}
        onChange={onChange}
      />
      <FormInput
        required
        label="Adresse email"
        name="email"
        type="email"
        value={data.email}
        onChange={onChange}
      />
      <FormInput
        required
        label="Téléphone"
        name="phone"
        type="tel"
        value={data.phone}
        onChange={onChange}
      />
      <FormInput
        required
        minLength={8}
        label="Mot de passe"
        name="password"
        type="password"
        value={data.password}
        onChange={onChange}
      />
      <Button className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900" type="submit">
        Continuer <ChevronRight />
      </Button>
    </form>
  );
}
