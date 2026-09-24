import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';

const FIELD_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50';
const LABEL_CLS = 'block text-sm font-medium text-slate-700 mb-1';

const TVA_OPTIONS = [0, 7, 13, 19];

/**
 * @param {boolean} open
 * @param {object|null} product — null = création
 * @param {object[]} categories
 * @param {object[]} suppliers
 * @param {(data) => Promise<void>} onSubmit
 * @param {() => void} onClose
 */
export function ProductForm({ open, product, categories, suppliers, onSubmit, onClose }) {
  const isEdit = !!product;

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
            code: product.code,
            barcode: product.barcode,
            name: product.name,
            purchase_price: product.purchase_price,
            selling_price: product.selling_price,
            stock_quantity: product.stock_quantity,
            stock_min: product.stock_min,
            stock_max: product.stock_max ?? '',
            tva_rate: product.tva_rate,
            unit_of_measure: product.unit_of_measure,
            categoryId: product.categoryId ?? '',
            supplierId: product.supplierId ?? '',
          }
        : {
            code: '', barcode: '', name: '',
            purchase_price: '', selling_price: '',
            stock_quantity: 0, stock_min: 0, stock_max: '',
            tva_rate: 19, unit_of_measure: 'pièce',
            categoryId: '', supplierId: '',
          }
    );
  }, [product, isEdit, reset]);

  const submit = handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      code: Number(data.code),
      barcode: Number(data.barcode),
      purchase_price: Number(data.purchase_price),
      selling_price: Number(data.selling_price),
      stock_quantity: Number(data.stock_quantity),
      stock_min: Number(data.stock_min),
      stock_max: data.stock_max ? Number(data.stock_max) : null,
      tva_rate: Number(data.tva_rate),
      categoryId: data.categoryId || null,
      supplierId: data.supplierId || null,
    });
  });

  return (
    <Modal
      open={open}
      title={isEdit ? 'Modifier le produit' : 'Nouveau produit'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Identifiants */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Identification
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Code *</label>
              <input
                type="number"
                {...register('code', { required: 'Requis' })}
                className={FIELD_CLS}
                placeholder="Ex : 1001"
              />
              {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLS}>Code-barres *</label>
              <input
                type="number"
                {...register('barcode', { required: 'Requis' })}
                className={FIELD_CLS}
                placeholder="Ex : 3012345678901"
              />
              {errors.barcode && <p className="mt-1 text-xs text-rose-500">{errors.barcode.message}</p>}
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Nom *</label>
            <input
              {...register('name', { required: 'Le nom est requis' })}
              className={FIELD_CLS}
              placeholder="Ex : Câble USB-C 2m"
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>
        </fieldset>

        {/* Classification */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Classification
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Catégorie</label>
              <select {...register('categoryId')} className={FIELD_CLS}>
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fournisseur</label>
              <select {...register('supplierId')} className={FIELD_CLS}>
                <option value="">— Aucun —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Unité de mesure</label>
              <input
                {...register('unit_of_measure')}
                className={FIELD_CLS}
                placeholder="pièce, kg, litre…"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>TVA</label>
              <select {...register('tva_rate')} className={FIELD_CLS}>
                {TVA_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        {/* Prix */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Prix
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>Prix d'achat *</label>
              <input
                type="number"
                step="0.001"
                {...register('purchase_price', { required: 'Requis', min: 0 })}
                className={FIELD_CLS}
                placeholder="0.000"
              />
              {errors.purchase_price && <p className="mt-1 text-xs text-rose-500">{errors.purchase_price.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLS}>Prix de vente *</label>
              <input
                type="number"
                step="0.001"
                {...register('selling_price', { required: 'Requis', min: 0 })}
                className={FIELD_CLS}
                placeholder="0.000"
              />
              {errors.selling_price && <p className="mt-1 text-xs text-rose-500">{errors.selling_price.message}</p>}
            </div>
          </div>
        </fieldset>

        {/* Stock */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Stock
          </legend>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLS}>Qté actuelle</label>
              <input
                type="number"
                {...register('stock_quantity', { min: 0 })}
                className={FIELD_CLS}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Seuil min *</label>
              <input
                type="number"
                {...register('stock_min', { required: 'Requis', min: 0 })}
                className={FIELD_CLS}
              />
              {errors.stock_min && <p className="mt-1 text-xs text-rose-500">{errors.stock_min.message}</p>}
            </div>
            <div>
              <label className={LABEL_CLS}>Seuil max</label>
              <input
                type="number"
                {...register('stock_max', { min: 0 })}
                className={FIELD_CLS}
                placeholder="Illimité"
              />
            </div>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
