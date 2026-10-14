import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { getMyCompany, updateMyCompany } from '@/services/companyService';
import { isValidMatriculeFiscal } from '@/lib/fiscal';

const EMPTY = { name: '', matriculeFiscale: '', address: '', phone: '' };

const INPUT_CLS =
  'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-400 border-slate-300 focus:border-cyan-700 focus:ring-cyan-700';

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'La raison sociale est obligatoire';
  if (!form.matriculeFiscale.trim()) errors.matriculeFiscale = 'Le matricule fiscal est obligatoire';
  else if (!isValidMatriculeFiscal(form.matriculeFiscale))
    errors.matriculeFiscale = 'Format attendu : 1234567A/A/M/000';
  if (!form.address.trim()) errors.address = "L'adresse est obligatoire sur les factures";
  return errors;
}

function Field({ id, label, hint, error, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

/**
 * Informations légales de l'entreprise — elles apparaissent sur toutes les
 * factures, devis et bons (mentions obligatoires, art. 18 du Code de la TVA).
 */
export function CompanySettingsForm() {
  const toast = useToast();
  const { setUser } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    getMyCompany()
      .then(({ company }) => {
        if (cancelled || !company) return;
        setForm({
          name: company.name ?? '',
          matriculeFiscale: company.matriculeFiscale ?? '',
          address: company.address ?? '',
          phone: company.phone ?? '',
        });
      })
      .catch((err) => !cancelled && toast.error(err.message || "Impossible de charger l'entreprise"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const clientErrors = validate(form);
  const errors = touched ? { ...clientErrors, ...serverErrors } : serverErrors;
  const complete = Object.keys(clientErrors).length === 0;

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setServerErrors((s) => ({ ...s, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!complete) return;

    setSaving(true);
    try {
      const { company } = await updateMyCompany(form);
      setForm((f) => ({ ...f, matriculeFiscale: company?.matriculeFiscale ?? f.matriculeFiscale }));
      setUser((u) => (u ? { ...u, company_name: company?.name ?? form.name } : u));
      toast.success('Informations de l’entreprise enregistrées', {
        description: 'Elles apparaîtront sur vos prochains documents.',
      });
    } catch (err) {
      setServerErrors(err.payload?.errors ?? {});
      toast.error(err.message || "Impossible d'enregistrer l'entreprise");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    );
  }

  const fieldProps = (id) => ({
    id,
    'aria-invalid': errors[id] ? 'true' : 'false',
    'aria-describedby': errors[id] ? `${id}-error` : undefined,
    className: INPUT_CLS,
  });

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-xl border bg-white p-6 shadow-sm md:col-span-2"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900">Informations légales</h2>
          <p className="text-xs text-slate-500">
            Mentions obligatoires sur vos factures, devis et bons (art. 18 du Code de la TVA).
          </p>
        </div>

        <Field id="name" label="Raison sociale *" error={errors.name}>
          <input {...fieldProps('name')} value={form.name} onChange={set('name')} autoComplete="organization" />
        </Field>

        <Field
          id="matriculeFiscale"
          label="Matricule fiscal *"
          hint="Tel qu’il figure sur votre carte d’identification fiscale — ex. 1234567A/A/M/000"
          error={errors.matriculeFiscale}
        >
          <input
            {...fieldProps('matriculeFiscale')}
            value={form.matriculeFiscale}
            onChange={set('matriculeFiscale')}
            className={`${INPUT_CLS} font-mono uppercase`}
            spellCheck={false}
          />
        </Field>

        <Field id="address" label="Adresse du siège *" error={errors.address}>
          <textarea
            {...fieldProps('address')}
            rows={2}
            value={form.address}
            onChange={set('address')}
            autoComplete="street-address"
          />
        </Field>

        <Field id="phone" label="Téléphone" error={errors.phone}>
          <input {...fieldProps('phone')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="rounded-xl">
            <Save className="mr-2 size-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>

      {/* Aperçu de l'en-tête tel qu'il sera imprimé */}
      <aside className="h-fit space-y-3 rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase">
          Aperçu sur vos documents
        </h3>
        <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs leading-relaxed text-slate-700">
          <p className="font-bold uppercase">{form.name || 'Raison sociale'}</p>
          <p>{form.address || 'Adresse'}</p>
          {form.phone && <p>Tél. : {form.phone}</p>}
          <p>
            MF : <span className="font-mono">{form.matriculeFiscale.toUpperCase() || '—'}</span>
          </p>
        </div>
        <p className={`flex items-center gap-1.5 text-xs ${complete ? 'text-emerald-700' : 'text-amber-700'}`}>
          {complete ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : (
            <Building2 className="size-3.5" aria-hidden="true" />
          )}
          {complete ? 'Mentions obligatoires complètes' : 'Mentions obligatoires incomplètes'}
        </p>
      </aside>
    </div>
  );
}
