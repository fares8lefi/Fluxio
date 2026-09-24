import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';

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
          }
        : { name: '', code: '', email: '', phone: '', address: '' }
    );
  }, [supplier, isEdit, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      code: data.code ? Number(data.code) : undefined,
    });
  });

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      onClose={onClose}
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
          <label className={LABEL_CLS}>Adresse</label>
          <textarea
            {...register('address')}
            rows={2}
            className={FIELD_CLS}
            placeholder="Adresse complète…"
          />
        </div>
      </form>
    </Modal>
  );
}
