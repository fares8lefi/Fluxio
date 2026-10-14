import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Gauge, Info } from 'lucide-react';
import {
  getManagerKpis,
  getManagerSales,
  getManagerClients,
  getManagerStock,
  getManagerActivity,
} from '@/services/managerService';
import { useManagerPeriod } from './use-manager-period';
import { useManagerBlocks } from './use-manager-block';
import { PeriodFilter } from './PeriodFilter';
import { ManagerKpiRow } from './ManagerKpiRow';
import { ManagerSalesBlock } from './ManagerSalesBlock';
import { ManagerClientsBlock } from './ManagerClientsBlock';
import { ManagerStockBlock } from './ManagerStockBlock';
import { ManagerActivityBlock } from './ManagerActivityBlock';
import { formatDate } from '@/components/charts/manager/formatters';

// Objet stable : évite de relancer les requêtes à chaque rendu.
const LOADERS = {
  kpis: getManagerKpis,
  sales: getManagerSales,
  clients: getManagerClients,
  stock: getManagerStock,
  activity: getManagerActivity,
};

/**
 * Page « Pilotage » — indicateurs de gestion pour le propriétaire.
 * Les 5 blocs sont chargés en parallèle (`Promise.allSettled`) : un bloc en
 * échec n'empêche pas l'affichage des autres.
 */
export function ManagerDashboard() {
  const { user } = useAuth();
  const {
    period,
    startDate,
    endDate,
    isCustom,
    customRangeValid,
    query,
    fallbackLabel,
    setPreset,
    setCustomRange,
  } = useManagerPeriod();

  const { blocks, reload } = useManagerBlocks(LOADERS, query, !isCustom || customRangeValid);

  const kpis = blocks.kpis;
  const periodLabel = kpis?.data?.period?.label ?? fallbackLabel;
  const rangeLabel = useMemo(() => {
    const periodData = kpis?.data?.period;
    if (!periodData) return null;
    return `${formatDate(periodData.startDate)} → ${formatDate(periodData.endDate)}`;
  }, [kpis?.data?.period]);

  return (
    <div className="space-y-8">
      {/* ── En-tête ── */}
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
          <Gauge className="size-6 text-cyan-700" aria-hidden="true" />
          Pilotage
        </h1>
        <p className="text-sm text-slate-500">
          Vue d'ensemble de l'activité et de la rentabilité de{' '}
          <strong className="text-slate-700">{user?.company_name}</strong> — facturé, encaissé, marge,
          stock et conformité.
        </p>
      </header>

      <PeriodFilter
        period={period}
        startDate={startDate}
        endDate={endDate}
        isCustom={isCustom}
        customRangeValid={customRangeValid}
        onPreset={setPreset}
        onCustomRange={setCustomRange}
        onRefresh={reload}
        refreshing={kpis.loading && !!kpis.data}
      />

      {/* Période analysée */}
      {rangeLabel && (
        <p className="-mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Période analysée : <strong className="font-semibold text-slate-700">{periodLabel}</strong> ({rangeLabel})
          </span>
        </p>
      )}

      {/* ── Indicateurs clés ── */}
      {kpis.error && !kpis.data ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-800">Indicateurs indisponibles</p>
          <p className="mt-1 text-xs text-rose-700">{kpis.error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-xs"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <ManagerKpiRow kpis={kpis.data?.kpis} isLoading={kpis.loading} />
      )}

      {/* ── Bloc 1 ── */}
      <ManagerSalesBlock block={blocks.sales} onRetry={reload} />

      {/* ── Bloc 2 ── */}
      <ManagerClientsBlock block={blocks.clients} onRetry={reload} />

      {/* ── Bloc 3 ── */}
      <ManagerStockBlock block={blocks.stock} onRetry={reload} />

      {/* ── Bloc 4 ── */}
      <ManagerActivityBlock block={blocks.activity} onRetry={reload} />

      {/* ── Limites du modèle ── */}
      <footer className="rounded-xl border border-dashed bg-white/60 p-4 text-[11px] text-slate-500">
        <p className="font-semibold text-slate-600">Limites connues des indicateurs</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>La marge utilise le prix d'achat figé au moment de chaque vente (ventes antérieures au 14/10/2026 : prix d'achat à cette date).</li>
          <li>Les « nouveaux clients » correspondent aux clients dont le premier mouvement tombe dans la période (pas de date de création en base).</li>
          <li>Les factures annulées et les mouvements annulés sont exclus de tous les montants.</li>
        </ul>
      </footer>
    </div>
  );
}

export default ManagerDashboard;