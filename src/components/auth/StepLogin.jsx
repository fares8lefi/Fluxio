import { useState } from 'react';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/auth/FormInput';

export function StepLogin({ email, password, onChange, onSubmit, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">Bienvenue</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connectez-vous à votre espace Fluxio.
        </p>
      </div>
      <FormInput
        required
        label="Adresse email"
        name="email"
        type="email"
        value={email}
        onChange={onChange}
      />
      <div className="relative">
        <FormInput
          required
          label="Mot de passe"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={onChange}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <Button
        disabled={loading}
        className="mt-2 h-11 bg-cyan-800 hover:bg-cyan-900"
        type="submit"
      >
        {loading ? 'Connexion…' : 'Se connecter'} <ChevronRight className="ml-1" />
      </Button>
    </form>
  );
}
