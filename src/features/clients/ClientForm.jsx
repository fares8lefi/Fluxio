import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';

const FIELD_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 mb-1';

/**
 * Champs requis par le backend (ClientValidations.js) :
 *  - name            string  REQUIRED
 *  - phone           string  REQUIRED
 *  - matriculeFiscale string  REQUIRED
 *  - codeTva         string  optional / nullable
 *
 * @param {boolean}     open
 * @param {object|null} client  — null = création
 * @param {(data) => Promise<void>} onSubmit
 * @param {() => void}  onClose
 */
export function ClientForm({ open, client, onSubmit, onClose }) {
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    reset(
      isEdit
        ? {
            name:              client.name             ?? '',
            phone:             client.phone            ?? '',
            matriculeFiscale:  client.matriculeFiscale ?? '',
            codeTva:           client.codeTva          ?? '',
          }
        : { name: '', phone: '', matriculeFiscale: '', codeTva: '' }
    );
  }, [client, isEdit, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      name:             data.name.trim(),
      phone:            data.phone.trim(),
      matriculeFiscale: data.matriculeFiscale.trim(),
      codeTva:          data.codeTva?.trim() || null,
    });
  });

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier le client' : 'Nouveau client'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="client-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={submit} className="space-y-4">

        {/* Nom + Téléphone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Nom *</label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              className={FIELD_CLS}
              placeholder="Ex : Entreprise ABC"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
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

        {/* Matricule Fiscale + Code TVA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Matricule Fiscale *</label>
            <input
              {...register('matriculeFiscale', { required: 'Le matricule fiscale est requis' })}
              className={FIELD_CLS}
              placeholder="Ex : 1234567A/P/M000"
            />
            {errors.matriculeFiscale && (
              <p className="mt-1 text-xs text-rose-500">{errors.matriculeFiscale.message}</p>
            )}
          </div>
          <div>
            <label className={LABEL_CLS}>Code TVA</label>
            <input
              {...register('codeTva')}
              className={FIELD_CLS}
              placeholder="Ex : 0123456A/P/M000"
            />
          </div>
        </div>

      </form>
    </Modal>
  );
}
