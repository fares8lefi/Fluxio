import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';

const FIELD_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50';

const LABEL_CLS = 'block text-sm font-medium text-slate-700 mb-1';

/**
 * @param {boolean} open
 * @param {object|null} category — null = création, object = édition
 * @param {(data) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */
export function CategoryForm({ open, category, onSubmit, onClose }) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    reset(
      isEdit
        ? { name: category.name, code: category.code, description: category.description ?? '' }
        : { name: '', code: '', description: '' }
    );
  }, [category, isEdit, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({ ...data, code: Number(data.code) });
  });

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className={LABEL_CLS}>Nom *</label>
          <input
            {...register('name', { required: 'Le nom est requis' })}
            className={FIELD_CLS}
            placeholder="Ex : Électronique"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Code *</label>
          <input
            type="number"
            {...register('code', {
              required: 'Le code est requis',
              min: { value: 1, message: 'Le code doit être positif' },
            })}
            className={FIELD_CLS}
            placeholder="Ex : 100"
          />
          {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code.message}</p>}
        </div>

        <div>
          <label className={LABEL_CLS}>Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className={FIELD_CLS}
            placeholder="Description facultative…"
          />
        </div>
      </form>
    </Modal>
  );
}
