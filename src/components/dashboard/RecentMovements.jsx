import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  ArrowRight,
  History,
  TriangleAlert,
  Ban,
  Package,
} from 'lucide-react';

/** Description lisible d'un type de mouvement (libellé + ton + pictogramme) */
const MOVEMENT_TYPES = {
  IN: { label: 'Entrée', variant: 'info', Icon: ArrowDownLeft },
  OUT: { label: 'Sortie', variant: 'active', Icon: ArrowUpRight },
  RETURN_SUPPLIER: { label: 'Retour fournisseur', variant: 'alert', Icon: RotateCcw },
  RETURN_CLIENT: { label: 'Retour client', variant: 'inactive', Icon: RotateCcw },
};

const formatMoney = (value) => Number(value ?? 0).toFixed(3);

const formatInt = (value) => Number(value ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });

const formatQuantity = (items = []) =>
  items.reduce((total, item) => total + (Number(item.quantity) || 0), 0);

/** « il y a 3 h », « il y a 2 j » — journalisation lisible */
const relativeTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 1) return "à l'instant";
  if (Math.abs(diffMinutes) < 60) return formatter.format(-diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(-diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return formatter.format(-diffDays, 'day');

  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Horodatage absolu (horodatage complet de la journalisation) */
const absoluteTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Fournisseur pour une entrée, client pour une sortie, sinon « — » */
const partnerOf = (movement) => movement.client?.name || movement.supplier?.name || null;

/**
 * Journal des 5 derniers mouvements de stock (page d'accueil).
 * @param {{
 *   movements?: Array<object>,
 *   isLoading?: boolean,
 *   error?: string|null,
 *   onSeeAll?: () => void
 * }} props
 */
export function RecentMovements({ movements = [], isLoading = false, error = null, onSeeAll }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm" aria-label="Journal des mouvements">
      <div className="flex items-center justify-between gap-3 border-b bg-slate-50/50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
            <History className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Journal des mouvements</h3>
            <p className="text-xs text-slate-500">
              Les {movements.length} mouvement{movements.length > 1 ? 's' : ''} le{movements.length > 1 ? 's' : ''} plus
              récent{movements.length > 1 ? 's' : ''}, du plus récent au plus ancien.
            </p>
          </div>
        </div>

        {onSeeAll && (
          <Button variant="outline" size="sm" onClick={onSeeAll} className="shrink-0 rounded-xl text-xs">
            Voir tout l'historique <ArrowRight className="ml-1 size-3.5" />
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="flex items-center gap-2 px-5 py-8 text-center text-xs text-rose-600">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : isLoading ? (
        <ul className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-3.5">
              <span className="size-8 shrink-0 animate-pulse rounded-lg bg-slate-100" />
              <span className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <span className="ml-auto h-3 w-20 animate-pulse rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : movements.length === 0 ? (
        <EmptyState
          Icon={History}
          title="Aucun mouvement enregistré"
          description="Les entrées, sorties et retours de stock apparaîtront ici dès le premier mouvement."
        />
      ) : (
        <ol className="divide-y">
          {movements.map((movement) => {
            const config = MOVEMENT_TYPES[movement.type] ?? {
              label: movement.type,
              variant: 'inactive',
              Icon: Package,
            };
            const { Icon } = config;
            const isCancelled = movement.status === 'CANCELLED';
            const partner = partnerOf(movement);
            const quantity = formatQuantity(movement.items);

            return (
              <li
                key={movement.id}
                className={`flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50/60 ${
                  isCancelled ? 'opacity-60' : ''
                }`}
              >
                {/* Colonne « pastille » de la frise chronologique */}
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                    isCancelled
                      ? 'bg-slate-100 text-slate-500'
                      : config.variant === 'info'
                        ? 'bg-cyan-50 text-cyan-700'
                        : config.variant === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : config.variant === 'alert'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {isCancelled ? <Ban className="size-4" /> : <Icon className="size-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{config.label}</span>
                    <Badge variant={isCancelled ? 'danger' : config.variant}>
                      {isCancelled ? 'Annulé' : movement.status}
                    </Badge>
                    {movement.reference && (
                      <span className="truncate font-mono text-[11px] text-slate-500">{movement.reference}</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {partner ? (
                      <>
                        {partner}
                        <span className="mx-1 text-slate-300">·</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-600">Aucun tiers rattaché</span>
                        <span className="mx-1 text-slate-300">·</span>
                      </>
                    )}
                    {formatInt(quantity)} unité{quantity > 1 ? 's' : ''}
                    {movement.items?.length > 1 && (
                      <span className="mx-1 text-slate-300">·</span>
                    )}
                    {movement.items?.length > 1 && `${movement.items.length} lignes`}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold tabular-nums text-slate-900">
                    {formatMoney(movement.total_amount)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">TND</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500" title={absoluteTime(movement.created_at)}>
                    {relativeTime(movement.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default RecentMovements;