import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, FileWarning, Search, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { generateInvoice } from '@/services/invoiceService';
import { formatTND, round3 } from '@/lib/fiscal';
import { useInvoiceableMovements } from './use-invoiceable-movements';
import {
  InvoiceableMovementPicker,
  MissingFieldsList,
  MovementSummary,
  ReadyBanner,
} from './InvoiceableMovements';

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';
const LABEL_CLS = 'block text-xs font-semibold text-slate-700 mb-1';

/** Libellés et exemples des champs complétables via le formulaire */
const FIELD_META = {
  name: { label: 'Nom du client', placeholder: 'Ex : Entreprise ABC' },
  phone: { label: 'Téléphone', placeholder: 'Ex : +216 71 234 567' },
  matriculeFiscale: { label: 'Matricule fiscal', placeholder: 'Ex : 1234567A/P/M000' },
  address: { label: 'Adresse', placeholder: 'Ex : 10 rue de Tunis' },
  codeTva: { label: 'Code TVA', placeholder: 'Ex : 0123456A/P/M000' },
};

const CLIENT_FIELDS = ['name', 'phone', 'matriculeFiscale', 'address', 'codeTva'];
const EMPTY_CLIENT_FORM = { name: '', phone: '', matriculeFiscale: '', address: '', codeTva: '' };
const EMPTY_COMPANY_FORM = { matriculeFiscale: '', address: '', phone: '' };

const EMPTY_OPTIONS = {
  purchase_order_ref: '',
  is_suspended: false,
  attestation_ref: '',
  apply_rs: false,
  rs_rate: 1.0,
  payment_terms: 'Paiement comptant',
  notes: '',
};

const filled = (form) =>
  Object.fromEntries(
    Object.entries(form).filter(([, value]) => typeof value === 'string' && value.trim() !== '')
  );

/**
 * Modale de génération d'une facture de vente.
 * L'utilisateur choisit un mouvement de type SORTIE (OUT) ; si des informations
 * sont manquantes (client, matricule fiscal, adresse…) un formulaire de complétion
 * est affiché avant la génération.
 *
 * @param {boolean} open
 * @param {Array}   clients
 * @param {string}  initialMovementId
 * @param {() => void} onClose
 * @param {(invoice: object) => void} onSuccess
 */
export function GenerateInvoiceModal({
  open,
  clients = [],
  initialMovementId = '',
  onClose,
  onSuccess,
}) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [onlyPending, setOnlyPending] = useState(true);
  const [movement, setMovement] = useState(null);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [clientMode, setClientMode] = useState('keep');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientForm, setClientForm] = useState(EMPTY_CLIENT_FORM);
  const [companyForm, setCompanyForm] = useState(EMPTY_COMPANY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const filters = useMemo(
    () => ({
      page,
      search,
      ...(onlyPending && !initialMovementId ? { onlyNotInvoiced: true } : {}),
      ...(initialMovementId ? { movementId: initialMovementId } : {}),
    }),
    [page, search, onlyPending, initialMovementId]
  );

  const { movements, loading, error: listError } = useInvoiceableMovements(filters);

  // Recherche différée pour ne pas requêter à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const selectMovement = useCallback((selected) => {
    setMovement(selected);
    setOptions((prev) => ({
      ...prev,
      notes: selected.suggested_options?.notes ?? prev.notes,
      payment_terms: selected.suggested_options?.payment_terms ?? prev.payment_terms,
    }));
    setClientMode(selected.client ? 'keep' : 'create');
    setSelectedClientId(selected.client?.id ?? '');
    setClientForm({ ...EMPTY_CLIENT_FORM, ...(selected.client ?? {}) });
    setCompanyForm({
      matriculeFiscale: '',
      address: '',
      phone: '',
    });
    setFieldErrors({});
    setError(null);
  }, []);

  // Réinitialisation à l'ouverture + présélection du mouvement demandé
  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSearchInput('');
    setPage(1);
    setMovement(null);
    setOptions(EMPTY_OPTIONS);
    setClientForm(EMPTY_CLIENT_FORM);
    setCompanyForm(EMPTY_COMPANY_FORM);
    setFieldErrors({});
    setError(null);
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open || !initialMovementId || movement) return;
    const found = movements.find((m) => m.id === initialMovementId);
    if (found) selectMovement(found);
  }, [open, initialMovementId, movements, movement, selectMovement]);

  const missingByScope = useMemo(() => {
    const groups = { company: [], client: [], items: [], invoice: [] };
    (movement?.readiness?.missing_fields ?? []).forEach((field) => {
      if (groups[field.scope]) groups[field.scope].push(field);
    });
    return groups;
  }, [movement]);

  const blockedByItems = missingByScope.items.some((field) => field.required);
  const needsCompletion = (movement?.readiness?.missing_fields ?? []).length > 0;

  const set = (key, value) => setOptions((prev) => ({ ...prev, [key]: value }));

  // Aperçu de la retenue : le serveur refait le calcul, ceci ne sert qu'à l'affichage
  const previewTtc = movement?.preview
    ? options.is_suspended
      ? movement.preview.total_ht
      : movement.preview.total_ttc
    : null;
  const rsApplied = options.apply_rs && !options.is_suspended;
  const previewRs = rsApplied && previewTtc !== null ? round3((previewTtc * Number(options.rs_rate)) / 100) : 0;
  const belowRsThreshold = rsApplied && Number(options.rs_rate) === 1 && previewTtc !== null && previewTtc < 1000;
  const setClient = (key, value) => setClientForm((prev) => ({ ...prev, [key]: value }));
  const setCompany = (key, value) => setCompanyForm((prev) => ({ ...prev, [key]: value }));

  const buildFieldErrors = () => {
    const errors = {};

    missingByScope.company
      .filter((field) => field.required)
      .forEach((field) => {
        if (!companyForm[field.field]?.trim()) {
          errors[`company.${field.field}`] = `${FIELD_META[field.field]?.label ?? field.label} est obligatoire`;
        }
      });

    if (clientMode === 'create') {
      ['name', 'phone', 'matriculeFiscale'].forEach((key) => {
        if (!clientForm[key].trim()) {
          errors[`client.${key}`] = `${FIELD_META[key].label} est obligatoire pour créer le client`;
        }
      });
    } else {
      missingByScope.client
        .filter((field) => field.required)
        .forEach((field) => {
          const current = clientForm[field.field] ?? movement?.client?.[field.field] ?? '';
          if (!current.trim()) {
            errors[`client.${field.field}`] = `${FIELD_META[field.field]?.label ?? field.label} est obligatoire`;
          }
        });
    }

    if (options.is_suspended && !options.attestation_ref.trim()) {
      errors.attestation_ref = "L'attestation fiscale est obligatoire en suspension de TVA";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!movement) {
      setError('Sélectionnez un mouvement de vente (SORTIE) à facturer');
      return;
    }

    const errors = buildFieldErrors();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Complétez les informations obligatoires avant de générer la facture');
      return;
    }

    const clientPayload =
      clientMode === 'create'
        ? filled(clientForm)
        : { ...(movement?.client?.id ? { id: movement.client.id } : {}), ...filled(clientForm) };

    setSubmitting(true);
    setError(null);

    try {
      const result = await generateInvoice({
        movementId: movement.id,
        is_suspended: options.is_suspended,
        attestation_ref: options.attestation_ref,
        apply_rs: rsApplied,
        rs_rate: parseFloat(options.rs_rate),
        purchase_order_ref: options.purchase_order_ref,
        payment_terms: options.payment_terms,
        notes: options.notes,
        ...(clientMode === 'select' && selectedClientId ? { clientId: selectedClientId } : {}),
        ...(Object.keys(clientPayload).length > 0 ? { client: clientPayload } : {}),
        ...(Object.keys(filled(companyForm)).length > 0 ? { company: filled(companyForm) } : {}),
      });
      onSuccess?.(result?.invoice);
    } catch (err) {
      setError(err.message);
      const details = err.payload?.details ?? {};
      const missing = err.payload?.missing_fields ?? [];
      const serverErrors = { ...details };
      missing
        .filter((field) => field.scope === 'client' || field.scope === 'company')
        .forEach((field) => {
          serverErrors[`${field.scope}.${field.field}`] = field.message;
        });
      setFieldErrors(serverErrors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Générer une facture de vente"
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            {movement ? `Vente du ${new Date(movement.date).toLocaleDateString('fr-FR')}` : 'Aucune vente sélectionnée'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              form="invoice-form"
              type="submit"
              disabled={submitting || !movement || blockedByItems}
              className="bg-cyan-700 text-white hover:bg-cyan-800"
            >
              {submitting ? 'Génération…' : 'Générer la facture'}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="invoice-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <p className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs text-cyan-800">
          <strong>Réglementation tunisienne :</strong> la facture inclut automatiquement le{' '}
          <strong>Timbre Fiscal (1,000 DT)</strong> et la TVA calculée par tranche.
        </p>

        {/* ── 1. Mouvement de vente ── */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800">1. Vente à facturer</h3>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <label htmlFor="invoice-movement-search" className="sr-only">
                Rechercher une vente
              </label>
              <input
                id="invoice-movement-search"
                className={`${INPUT_CLS} pl-9`}
                placeholder="Rechercher par client, référence ou note…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={Boolean(initialMovementId)}
              />
            </div>
            <label
              className={`flex items-center gap-2 text-xs font-medium text-slate-600 ${
                initialMovementId ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                className="accent-cyan-700"
                checked={onlyPending && !initialMovementId}
                disabled={Boolean(initialMovementId)}
                onChange={(e) => {
                  setOnlyPending(e.target.checked);
                  setPage(1);
                }}
              />
              Sans facture uniquement
            </label>
          </div>

          {listError && (
            <p role="alert" className="text-xs text-rose-600">
              {listError}
            </p>
          )}

          <InvoiceableMovementPicker
            movements={movements}
            loading={loading}
            selectedId={movement?.id}
            onSelect={selectMovement}
          />

          {!initialMovementId && movements.length === 10 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                ← Précédent
              </button>
              <span>Page {page}</span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1 font-medium hover:bg-slate-50"
              >
                Suivant →
              </button>
            </div>
          )}
        </section>

        {movement && (
          <>
            {/* ── 2. Récapitulatif ── */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">2. Récapitulatif</h3>
              <MovementSummary movement={movement} />
            </section>

            {/* ── 3. Informations manquantes ── */}
            {needsCompletion && (
              <section className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
                  3. Informations à compléter
                </h3>

                {blockedByItems && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <p className="font-semibold">Corrigez d'abord le mouvement de vente</p>
                    <MissingFieldsList fields={missingByScope.items} max={5} />
                  </div>
                )}

                {missingByScope.company.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <Building2 className="size-4" aria-hidden="true" />
                      Entreprise émettrice
                    </p>
                    {missingByScope.company.map((field) => (
                      <CompletionInput
                        key={field.field}
                        field={field}
                        value={companyForm[field.field] ?? ''}
                        error={fieldErrors[`company.${field.field}`]}
                        onChange={(value) => setCompany(field.field, value)}
                      />
                    ))}
                  </div>
                )}

                {(missingByScope.client.length > 0 || !movement.client) && (
                  <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                      <UserPlus className="size-4" aria-hidden="true" />
                      Client de la facture
                    </p>

                    {!movement.client && clients.length > 0 && (
                      <div className="flex gap-2 text-xs">
                        {[
                          { key: 'create', label: 'Nouveau client' },
                          { key: 'select', label: 'Client existant' },
                        ].map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setClientMode(tab.key)}
                            className={`rounded-lg border px-3 py-1.5 font-semibold ${
                              clientMode === tab.key
                                ? 'border-cyan-600 bg-cyan-700 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {clientMode === 'select' && (
                      <div>
                        <label className={LABEL_CLS} htmlFor="invoice-client-select">
                          Client à rattacher *
                        </label>
                        <select
                          id="invoice-client-select"
                          className={INPUT_CLS}
                          value={selectedClientId}
                          onChange={(e) => {
                            setSelectedClientId(e.target.value);
                            setClientForm(EMPTY_CLIENT_FORM);
                          }}
                          required
                        >
                          <option value="">— Sélectionner un client —</option>
                          {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                              {client.matriculeFiscale ? ` — ${client.matriculeFiscale}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {clientMode === 'create' && (
                      <p className="text-[11px] text-amber-700">
                        Un nouveau client sera créé et rattaché automatiquement à cette vente.
                      </p>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {CLIENT_FIELDS.filter(
                        (key) =>
                          clientMode === 'create' ||
                          missingByScope.client.some((field) => field.field === key)
                      ).map((key) => (
                        <CompletionInput
                          key={key}
                          field={missingByScope.client.find((f) => f.field === key) ?? {
                            field: key,
                            label: FIELD_META[key].label,
                            required: key !== 'address' && key !== 'codeTva',
                          }}
                          value={clientForm[key] ?? ''}
                          error={fieldErrors[`client.${key}`]}
                          onChange={(value) => setClient(key, value)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {!needsCompletion && <ReadyBanner />}

            {/* ── 4. Options de facturation ── */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">
                {needsCompletion ? '4.' : '3.'} Options de facturation
              </h3>

              <div>
                <label className={LABEL_CLS} htmlFor="invoice-purchase-order">
                  N° Bon de Commande Client
                </label>
                <input
                  id="invoice-purchase-order"
                  className={INPUT_CLS}
                  placeholder="Référence BC client (optionnel)"
                  value={options.purchase_order_ref}
                  onChange={(e) => set('purchase_order_ref', e.target.value)}
                />
              </div>

              <div className="space-y-2 rounded-xl border bg-amber-50/50 p-3">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-amber-600"
                    checked={options.is_suspended}
                    onChange={(e) => {
                      set('is_suspended', e.target.checked);
                      // Pas de retenue sur une vente en suspension de TVA
                      if (e.target.checked) set('apply_rs', false);
                    }}
                  />
                  <span>
                    <span className="text-sm font-semibold text-amber-900">
                      Vente en suspension de TVA
                    </span>
                    <span className="mt-0.5 block text-[11px] text-amber-700">
                      Sociétés totalement exportatrices ou sous convention. TVA = 0, Timbre = 0.
                    </span>
                  </span>
                </label>
                {options.is_suspended && (
                  <div>
                    <label className={LABEL_CLS} htmlFor="invoice-attestation">
                      N° Attestation fiscale *
                    </label>
                    <input
                      id="invoice-attestation"
                      className={INPUT_CLS}
                      placeholder="Numéro d'attestation de suspension de TVA"
                      value={options.attestation_ref}
                      onChange={(e) => set('attestation_ref', e.target.value)}
                      aria-invalid={Boolean(fieldErrors.attestation_ref)}
                    />
                    {fieldErrors.attestation_ref && (
                      <p className="mt-1 text-xs text-rose-600">{fieldErrors.attestation_ref}</p>
                    )}
                  </div>
                )}
              </div>

              {!options.is_suspended && (
                <div className="space-y-2 rounded-xl border bg-indigo-50/50 p-3">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-indigo-600"
                      checked={options.apply_rs}
                      onChange={(e) => set('apply_rs', e.target.checked)}
                    />
                    <span>
                      <span className="text-sm font-semibold text-indigo-900">
                        Appliquer la Retenue à la Source (RS)
                      </span>
                      <span className="mt-0.5 block text-[11px] text-indigo-700">
                        Obligatoire si total ≥ 1000 DT TTC (marchandises) ou sur services.
                      </span>
                    </span>
                  </label>
                  {options.apply_rs && (
                    <div>
                      <label className={LABEL_CLS} htmlFor="invoice-rs-rate">
                        Taux RS *
                      </label>
                      <select
                        id="invoice-rs-rate"
                        className={INPUT_CLS}
                        value={options.rs_rate}
                        onChange={(e) => set('rs_rate', parseFloat(e.target.value))}
                      >
                        <option value={1}>1% — Achats de marchandises (≥ 1000 DT)</option>
                        <option value={5}>5% — Services / Prestations diverses</option>
                        <option value={15}>15% — Honoraires / Professions libérales</option>
                      </select>
                      {previewTtc !== null && (
                        <p className="mt-2 text-xs text-indigo-900">
                          Retenue <span className="font-semibold tabular-nums">{formatTND(previewRs)} DT</span>, net à
                          payer <span className="font-semibold tabular-nums">{formatTND(round3(previewTtc - previewRs))} DT</span>
                        </p>
                      )}
                      {belowRsThreshold && (
                        <p role="status" className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800">
                          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                          Le total ({formatTND(previewTtc)} DT TTC) est sous le seuil de 1 000 DT : la retenue de 1 % ne s'applique normalement pas.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS} htmlFor="invoice-payment-terms">
                    Conditions de paiement
                  </label>
                  <input
                    id="invoice-payment-terms"
                    className={INPUT_CLS}
                    value={options.payment_terms}
                    onChange={(e) => set('payment_terms', e.target.value)}
                  />
                </div>
                <div>
                  <label className={LABEL_CLS} htmlFor="invoice-notes">
                    Notes
                  </label>
                  <input
                    id="invoice-notes"
                    className={INPUT_CLS}
                    placeholder="Optionnel"
                    value={options.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {!movement && !loading && (
          <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-sm text-slate-500">
            <FileWarning className="size-4" aria-hidden="true" />
            Sélectionnez une vente de type SORTIE (OUT) pour continuer.
          </p>
        )}
      </form>
    </Modal>
  );
}

/**
 * Champ de complétion (client ou entreprise) piloté par la liste des champs manquants
 */
function CompletionInput({ field, value, error, onChange }) {
  const meta = FIELD_META[field.field] ?? { label: field.label, placeholder: '' };
  const inputId = `invoice-field-${field.field}`;

  return (
    <div>
      <label className={LABEL_CLS} htmlFor={inputId}>
        {meta.label}
        {field.required ? ' *' : ' (recommandé)'}
      </label>
      <input
        id={inputId}
        className={INPUT_CLS}
        placeholder={meta.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}