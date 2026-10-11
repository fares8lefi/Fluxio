import { useState, useEffect, useCallback } from 'react';
import {
  FileInput, Plus, Eye, CheckCircle2, XCircle, ArrowRightCircle,
  FileText, TrendingUp, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { InvoicePdfModal } from './InvoicePdfModal';
import {
  getAllQuotes, updateQuoteStatus, createQuote
} from '@/services/invoiceService';
import { getClients } from '@/services/clientService';

const STATUS_CONFIG = {
  DRAFT:     { label: 'Brouillon', variant: 'inactive',   badgeClass: 'bg-slate-100 text-slate-700' },
  SENT:      { label: 'Envoyé',    variant: 'info',       badgeClass: 'bg-cyan-100 text-cyan-700' },
  ACCEPTED:  { label: 'Accepté',   variant: 'active',     badgeClass: 'bg-emerald-100 text-emerald-700' },
  REJECTED:  { label: 'Rejeté',    variant: 'destructive',badgeClass: 'bg-rose-100 text-rose-700' },
  EXPIRED:   { label: 'Expiré',    variant: 'alert',      badgeClass: 'bg-amber-100 text-amber-700' },
  CONVERTED: { label: 'Converti',  variant: 'info',       badgeClass: 'bg-indigo-100 text-indigo-700' },
};

function CreateQuoteModal({ open, clients, onClose, onSuccess }) {
  const [form, setForm] = useState({
    clientId: '',
    itemsJson: '',
    notes: '',
    payment_terms: '',
    valid_until: '',
    is_suspended: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clientId) { setError('Client requis'); return; }
    
    let parsedItems = [];
    try {
      if (form.itemsJson) {
        parsedItems = JSON.parse(form.itemsJson);
      }
    } catch (err) {
      setError('Format JSON invalide pour les articles');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createQuote({
        ...form,
        items: parsedItems,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500';

  return (
    <Modal
      open={open}
      title="Nouveau Devis"
      onClose={onClose}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button form="quote-form" type="submit" disabled={loading} className="bg-cyan-700 hover:bg-cyan-800 text-white">
            {loading ? 'Création...' : 'Créer le devis'}
          </Button>
        </div>
      }
    >
      <form id="quote-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Client *</label>
          <select
            className={inputClass}
            value={form.clientId}
            onChange={e => set('clientId', e.target.value)}
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Articles (JSON) 
            <span className="text-slate-400 font-normal ml-1">Ex: [{`{"name":"Produit 1", "quantity":2, "price":100}`}]</span>
          </label>
          <textarea
            className={`${inputClass} font-mono text-xs`}
            rows={4}
            value={form.itemsJson}
            onChange={e => set('itemsJson', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Valide jusqu'au</label>
            <input
              type="date"
              className={inputClass}
              value={form.valid_until}
              onChange={e => set('valid_until', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Conditions de paiement</label>
            <input
              className={inputClass}
              value={form.payment_terms}
              onChange={e => set('payment_terms', e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer mt-4">
          <input
            type="checkbox"
            checked={form.is_suspended}
            onChange={e => set('is_suspended', e.target.checked)}
            className="mt-0.5 accent-cyan-600"
          />
          <div>
            <span className="text-sm font-semibold text-slate-900">Vente en suspension de TVA</span>
          </div>
        </label>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (optionnel)</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

export function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterStatus !== 'ALL') filters.status = filterStatus;

      const [quotesRes, clientsRes] = await Promise.allSettled([
        getAllQuotes(filters),
        getClients(),
      ]);
      if (quotesRes.status === 'fulfilled') setQuotes(quotesRes.value?.quotes ?? []);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value?.clients ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (quote, status) => {
    if (!window.confirm(`Changer le statut du devis ${quote.reference} en "${status}" ?`)) return;
    setActionLoading(quote.id);
    try {
      await updateQuoteStatus(quote.id, status);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // KPIs
  const totalTTC = quotes.reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalAccepted = quotes.filter(q => q.status === 'ACCEPTED' || q.status === 'CONVERTED').reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalPending = quotes.filter(q => q.status === 'SENT').reduce((s, q) => s + (q.total_ttc || 0), 0);
  const totalExpired = quotes.filter(q => q.status === 'EXPIRED').length;

  const tabs = [
    { key: 'ALL', label: 'Tous' },
    { key: 'DRAFT', label: 'Brouillons' },
    { key: 'SENT', label: 'Envoyés' },
    { key: 'ACCEPTED', label: 'Acceptés' },
    { key: 'REJECTED', label: 'Rejetés' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Devis & Pro Forma</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Gérez vos propositions commerciales avant facturation.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white"
        >
          <Plus className="mr-2 size-4" /> Nouveau Devis
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
              <FileText className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Devis</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-slate-900">
            {totalTTC.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Valeur totale</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Acceptés</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-emerald-700">
            {totalAccepted.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Devis validés</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">En cours</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-blue-700">
            {totalPending.toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">En attente de réponse</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="size-4" />
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase">Expirés</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums text-amber-700">{totalExpired}</p>
          <p className="text-xs text-slate-500 mt-0.5">Devis obsolètes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border bg-slate-50 p-0.5 text-sm font-medium">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-lg px-4 py-1.5 transition ${
                filterStatus === tab.key
                  ? 'bg-white font-semibold text-cyan-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-700" />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          Icon={FileInput}
          title="Aucun devis"
          description="Créez votre première proposition commerciale."
          actionLabel="Nouveau Devis"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Référence</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Validité</th>
                <th className="px-5 py-3 text-left">Client</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-right">Total TTC</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {quotes.map(quote => {
                const statusMeta = STATUS_CONFIG[quote.status] || STATUS_CONFIG.DRAFT;
                const isLoading = actionLoading === quote.id;
                
                return (
                  <tr key={quote.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">{quote.reference}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(quote.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{quote.client?.name ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.badgeClass}`}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums text-slate-900">
                      {Number(quote.total_ttc || 0).toFixed(3)} <span className="text-xs font-normal text-slate-400">TND</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {quote.status === 'SENT' && (
                          <>
                            <button
                              title="Marquer comme accepté"
                              onClick={() => handleStatusUpdate(quote, 'ACCEPTED')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                            >
                              <CheckCircle2 className="size-3.5" />
                            </button>
                            <button
                              title="Marquer comme rejeté"
                              onClick={() => handleStatusUpdate(quote, 'REJECTED')}
                              disabled={isLoading}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            >
                              <XCircle className="size-3.5" />
                            </button>
                          </>
                        )}
                        {quote.status === 'ACCEPTED' && (
                          <button
                            title="Convertir en facture"
                            onClick={() => handleStatusUpdate(quote, 'CONVERTED')}
                            disabled={isLoading}
                            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                          >
                            <ArrowRightCircle className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateQuoteModal
        open={createOpen}
        clients={clients}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); load(); }}
      />
    </div>
  );
}
