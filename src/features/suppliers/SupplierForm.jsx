import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { isValidMatriculeFiscal } from '@/lib/fiscal';

const FIELD_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 mb-1';

/**
 * @param {boolean} open
 * @param {object|null} supplier — null = création
 * @param {(data) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */
export function SupplierForm({ open, supplier, onSubmit, onClose }) {
  const isEdit = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    reset(
      isEdit
        ? {
            name: supplier.name,
            code: supplier.code ?? '',
            email: supplier.email ?? '',
            phone: supplier.phone,
            address: supplier.address ?? '',
            matriculeFiscale: supplier.matriculeFiscale ?? '',
          }
        : { name: '', code: '', email: '', phone: '', address: '', matriculeFiscale: '' }
    );
  }, [supplier, isEdit, reset]);

  const submit = handleSubmit(async (data) => {
    try {
      await onSubmit({
        ...data,
        code: data.code ? Number(data.code) : undefined,
      });
    } catch (err) {
      // Erreurs serveur : par champ si possible, sinon message global
      const details = err.payload?.details ?? {};
      Object.entries(details).forEach(([field, message]) => setError(field, { message }));
      setError('root', { message: err.message || 'Enregistrement impossible' });
    }
  });

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="supplier-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Nom *</label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              className={FIELD_CLS}
              placeholder="Ex : Distrib Plus"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Code</label>
            <input
              type="number"
              {...register('code')}
              className={FIELD_CLS}
              placeholder="Ex : 201"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Email</label>
            <input
              type="email"
              {...register('email')}
              className={FIELD_CLS}
              placeholder="contact@fournisseur.fr"
            />
            {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className={LABEL_CLS}>Téléphone *</label>
            <input
              {...register('phone', { required: 'Le téléphone est requis' })}
              className={FIELD_CLS}
              placeholder="Ex : +216 71 234 567"
            />
            {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="supplier-mf" className={LABEL_CLS}>Matricule fiscal</label>
          <input
            id="supplier-mf"
            {...register('matriculeFiscale', {
              validate: (v) => !v || isValidMatriculeFiscal(v) || 'Format attendu : 1234567A/A/M/000',
            })}
            className={`${FIELD_CLS} font-mono uppercase`}
            placeholder="1234567A/A/M/000"
            spellCheck={false}
          />
          {errors.matriculeFiscale ? (
            <p className="mt-1 text-xs text-rose-600">{errors.matriculeFiscale.message}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Affiché sur les bons de réception (facultatif).</p>
          )}
        </div>

        <div>
          <label className={LABEL_CLS}>Adresse</label>
          <textarea
            {...register('address')}
            rows={2}
            className={FIELD_CLS}
            placeholder="Adresse complète…"
          />
        </div>

        {errors.root && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}
