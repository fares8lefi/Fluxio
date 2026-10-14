import { motion } from 'motion/react';
import { StatCard } from '@/components/dashboard/StatCard';
import { staggerContainer } from '@/lib/motion';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  Wallet,
  Clock,
  FileText,
  ShoppingCart,
  Scale,
  Boxes,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { formatInt, formatMoney, formatPercent } from '@/components/charts/manager/formatters';

const formatDelta = (value) => `${value > 0 ? '+' : ''}${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/**
 * Pastille de variation vs période précédente.
 * Le sens n'est jamais porté par la couleur seule : pictogramme (▲/▼/–) +
 * signe explicite + `aria-label`.
 * @param {{ delta: number|null|undefined, goodDirection?: 'up'|'down' }} props
 */
export function DeltaBadge({ delta, goodDirection = 'up' }) {
  if (delta === null || delta === undefined) {
    return (
      <span
        className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500"
        title="Pas de comparable sur la période précédente"
      >
        <Minus className="size-3" aria-hidden="true" />
        n/c
      </span>
    );
  }

  const isUp = delta > 0;
  const isFlat = delta === 0;
  const isGood = isFlat ? null : goodDirection === 'down' ? !isUp : isUp;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  const tone = isGood === null
    ? 'bg-slate-100 text-slate-600'
    : isGood
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${tone}`}
      aria-label={
        isFlat
          ? 'Stable par rapport à la période précédente'
          : `${isUp ? 'Hausse' : 'Baisse'} de ${Math.abs(delta).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % par rapport à la période précédente`
      }
    >
      <Icon className="size-3" aria-hidden="true" />
      {isFlat ? '0 %' : formatDelta(delta)}
    </span>
  );
}

/**
 * Rangée de tuiles « vue d'ensemble » avec variation vs période précédente.
 * @param {{ kpis?: object, isLoading?: boolean }} props
 */
export function ManagerKpiRow({ kpis, isLoading = false }) {
  if (isLoading && !kpis) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-[104px] rounded-xl border" />
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const cards = [
    {
      key: 'revenue_billed_ttc',
      icon: TrendingUp,
      tone: 'cyan',
      label: 'CA facturé TTC',
      value: formatMoney(kpis.revenue_billed_ttc?.value),
      unit: 'TND',
      hint: `HT : ${formatMoney(kpis.revenue_billed_ht?.value)} TND`,
      goodDirection: 'up',
    },
    {
      key: 'revenue_collected',
      icon: Wallet,
      tone: 'emerald',
      label: 'CA encaissé TTC',
      value: formatMoney(kpis.revenue_collected?.value),
      unit: 'TND',
      hint: `Recouvrement : ${formatPercent(kpis.collection_rate_pct?.value)}`,
      goodDirection: 'up',
    },
    {
      key: 'outstanding_ttc',
      icon: Clock,
      tone: 'amber',
      label: 'Encours',
      value: formatMoney(kpis.outstanding_ttc?.value),
      unit: 'TND',
      hint: 'Factures en attente de règlement',
      goodDirection: 'down',
    },
    {
      key: 'average_basket',
      icon: FileText,
      tone: 'indigo',
      label: 'Panier moyen',
      value: formatMoney(kpis.average_basket?.value),
      unit: 'TND',
      hint: `${formatInt(kpis.invoice_count?.value)} facture(s)`,
      goodDirection: 'up',
    },
    {
      key: 'margin_estimated',
      icon: Scale,
      tone: 'emerald',
      label: 'Marge estimée',
      value: formatMoney(kpis.margin_estimated?.value),
      unit: 'TND',
      hint: kpis.margin_estimated_note || 'Sur le prix d’achat au moment de la vente',
      goodDirection: 'up',
    },
    {
      key: 'purchase_total',
      icon: ShoppingCart,
      tone: 'rose',
      label: 'Achats',
      value: formatMoney(kpis.purchase_total?.value),
      unit: 'TND',
      hint: `${formatInt(kpis.sales_volume?.value)} unité(s) vendue(s)`,
      goodDirection: 'down',
    },
    {
      key: 'stock_value_cost',
      icon: Boxes,
      tone: 'slate',
      label: 'Valeur du stock',
      value: formatMoney(kpis.stock_value_cost?.value),
      unit: 'TND',
      hint: 'Valorisée au prix d’achat',
      goodDirection: 'up',
    },
    {
      key: 'client_count',
      icon: Users,
      tone: 'slate',
      label: 'Clients actifs',
      value: formatInt(kpis.client_count?.value),
      hint: 'Comptes clients actifs',
      goodDirection: 'up',
    },
  ];

  return (
    <section className="space-y-2" aria-label="Indicateurs clés">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Vue d'ensemble</h2>
        <p className="text-[11px] text-slate-500">
          Variations comparées à la période précédente
        </p>
      </div>

      {/* Moment clé : les tuiles apparaissent en cascade à l'ouverture du tableau de bord */}
      <motion.div
        variants={staggerContainer()}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card) => (
          <StatCard
            key={card.key}
            icon={card.icon}
            tone={card.tone}
            label={card.label}
            value={card.value}
            unit={card.unit}
            hint={card.hint}
            trailing={<DeltaBadge delta={kpis[card.key]?.delta_pct} goodDirection={card.goodDirection} />}
          />
        ))}
      </motion.div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Package className="size-3 shrink-0" aria-hidden="true" />
        La marge est calculée sur le prix d'achat figé au moment de chaque vente.
      </p>
    </section>
  );
}

export default ManagerKpiRow;