import React, { useEffect, useState } from 'react'
import { TrendingUp, CheckCircle2, Award, ArrowUpRight } from 'lucide-react'
import type {
  Daughter,
  ReportPeriod,
  ReportStats,
  TaskCategory,
} from '../../types'
import { StatCard } from '../ui/Card'
import { reportsApi } from '#/services/api'

interface MotherReportsProps {
  daughter: Daughter
}

const CATEGORY_META: Record<TaskCategory, { name: string; color: string }> = {
  saude: { name: 'Saúde & Higiene', color: 'bg-emerald-500' },
  estudos: { name: 'Estudos & Tarefas Escolares', color: 'bg-indigo-500' },
  casa: { name: 'Organização do Quarto & Casa', color: 'bg-amber-500' },
  habito: { name: 'Hábitos de Leitura', color: 'bg-cyan-500' },
  lazer: { name: 'Lazer & Criatividade', color: 'bg-purple-500' },
}

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  daily: 'Hoje',
  weekly: 'Semanal',
  monthly: 'Mensal',
}

export const MotherReports: React.FC<MotherReportsProps> = ({ daughter }) => {
  const [period, setPeriod] = useState<ReportPeriod>('weekly')
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    reportsApi
      .get(period, daughter.id)
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((error) => {
        console.error('Falha ao carregar relatórios.', error)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [daughter.id, period])

  const summary = stats?.summary
  const series = stats?.series ?? []
  const chartTitle =
    period === 'monthly'
      ? 'Últimas 4 semanas'
      : period === 'daily'
        ? 'Últimos 7 dias (inclui hoje)'
        : 'Últimos 7 dias'

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 ui-card">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] mb-1">
            <span>Relatórios de Produtividade & Autonomia</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#5B5CE2] font-semibold">
              {daughter.name}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            Desempenho & Evolução
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Acompanhe a formação de hábitos, constância e taxa de conclusão
          </p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center p-1 ui-segment self-start sm:self-center">
          {(['daily', 'weekly', 'monthly'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                period === item
                  ? 'bg-white text-[#111827] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {PERIOD_LABEL[item]}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Taxa de Cumprimento"
          value={summary ? `${summary.rate}%` : '—'}
          subtext={`${summary?.totalCompleted ?? 0} de ${summary?.totalScheduled ?? 0} tarefas (${PERIOD_LABEL[period]})`}
          trend={
            summary
              ? {
                  value: `${summary.rateTrend.value >= 0 ? '+' : ''}${summary.rateTrend.value}% vs. período anterior`,
                  positive: summary.rateTrend.positive,
                }
              : undefined
          }
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Pontualidade"
          value={summary ? `${summary.punctuality}%` : '—'}
          subtext="Tarefas feitas no prazo"
          icon={<CheckCircle2 className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          label="Sequência Ativa"
          value={`${stats?.daughter.streakDays ?? daughter.streakDays} dias`}
          subtext="Dias seguindo 100% da rotina"
          icon={<Award className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          label="Pontos Conquistados"
          value={`+${summary?.points ?? 0} pts`}
          subtext="No período selecionado"
          icon={<ArrowUpRight className="w-4 h-4 text-purple-600" />}
        />
      </div>

      {/* Evolution Graph Section */}
      <div className="ui-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#111827]">
              Curva de Aproveitamento ({chartTitle})
            </h3>
            <p className="text-xs text-[#6B7280]">
              Percentual diário de tarefas concluídas no horário estipulado
            </p>
          </div>
          {summary && summary.rate >= 80 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 ui-chip self-start sm:self-center">
              Consistência Excelente
            </span>
          )}
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pb-3 ui-divider-y">
            {series.map((item, index) => {
              const isToday = index === series.length - 1
              return (
                <div
                  key={`${item.date}-${index}`}
                  className="flex flex-col items-center gap-2 h-full justify-end group"
                >
                  <span className="text-xs font-bold text-[#111827] tabular-nums">
                    {item.rate}%
                  </span>
                  <div className="w-full max-w-[42px] bg-[#EEF0FF] rounded-t-xl overflow-hidden h-36 flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-700 ${
                        item.rate >= 90
                          ? 'bg-[#5B5CE2]'
                          : item.rate >= 70
                            ? 'bg-indigo-400'
                            : 'bg-amber-400'
                      }`}
                      style={{ height: `${Math.max(item.rate, 2)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-xs font-semibold ${
                        isToday ? 'text-[#5B5CE2]' : 'text-[#6B7280]'
                      }`}
                    >
                      {item.dayName}
                    </p>
                    <p className="text-[10px] text-slate-400 tabular-nums">
                      {item.date}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-xs text-[#6B7280]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#5B5CE2]" />
                Meta atingida (&ge; 90%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-indigo-400" />
                Bom ritmo (70% - 89%)
              </span>
            </div>
            <span className="font-semibold text-[#111827]">
              Total de tarefas cumpridas no período:{' '}
              <strong className="text-[#5B5CE2] tabular-nums">
                {summary?.totalCompleted ?? 0} de {summary?.totalScheduled ?? 0}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="ui-card p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-bold text-[#111827]">
            Aproveitamento por Categoria de Tarefas
          </h3>
          <p className="text-xs text-[#6B7280]">
            Identifique onde sua filha se destaca e onde precisa de mais
            incentivo
          </p>
        </div>

        <div className="space-y-4">
          {(stats?.categories ?? []).map((category) => {
            const meta = CATEGORY_META[category.key]
            return (
              <div
                key={category.key}
                className="p-3.5 rounded-2xl bg-slate-50 ui-well"
              >
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#111827]">{meta.name}</span>
                  <span className="tabular-nums text-[#4A4BCF]">
                    {category.completed}/{category.total} feitas (
                    {category.rate}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${meta.color}`}
                    style={{ width: `${category.rate}%` }}
                  />
                </div>
              </div>
            )
          })}

          {!isLoading &&
            (stats?.categories ?? []).every(
              (category) => category.total === 0,
            ) && (
              <p className="text-xs text-[#6B7280] text-center py-4">
                Nenhuma tarefa programada neste período.
              </p>
            )}

          {isLoading && (
            <p className="text-xs text-[#6B7280] text-center py-4">
              Carregando relatórios…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
