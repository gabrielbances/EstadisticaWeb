import { ArrowRight, CircleCheckBig, Globe, Languages, LayoutTemplate } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function DashboardPage() {
  const { t } = useTranslation()

  const summary = [t('dashboard.summary1'), t('dashboard.summary2'), t('dashboard.summary3')]
  const status = [t('dashboard.recent1'), t('dashboard.recent2'), t('dashboard.recent3')]

  return (
    <div className="space-y-8">
      <section className="max-w-5xl">
        <p className="eyebrow mb-3">{t('dashboard.activeWorkspace')}</p>
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444654]">
          {t('dashboard.subtitle')}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="atelier-stat">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dde1ff] text-[#002c98]">
              <LayoutTemplate size={24} />
            </div>
            <span className="status-pill bg-[#a0f399] text-[#005312]">MVP</span>
          </div>
          <h2 className="section-title">{t('dashboard.cardAnovaTitle')}</h2>
          <p className="mt-4 text-sm leading-7 text-[#444654]">{t('dashboard.cardAnovaBody')}</p>
          <Link className="mt-8 inline-flex items-center gap-2 font-headline text-sm font-bold text-[#002c98]" to="/anova">
            {t('dashboard.cardButton')}
            <ArrowRight size={16} />
          </Link>
        </article>

        <article className="atelier-stat">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a0f399] text-[#005312]">
              <Languages size={24} />
            </div>
            <span className="status-pill bg-[#efeee3] text-[#6c6d78]">Ready</span>
          </div>
          <h2 className="section-title">{t('dashboard.cardChiTitle')}</h2>
          <p className="mt-4 text-sm leading-7 text-[#444654]">{t('dashboard.cardChiBody')}</p>
          <Link className="mt-8 inline-flex items-center gap-2 font-headline text-sm font-bold text-[#002c98]" to="/chi-square">
            {t('dashboard.cardButton')}
            <ArrowRight size={16} />
          </Link>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="atelier-panel-soft">
          <h2 className="section-title">{t('dashboard.summaryTitle')}</h2>
          <div className="mt-6 space-y-4">
            {summary.map((item) => (
              <div className="rounded-[22px] bg-white p-4" key={item}>
                <p className="text-sm leading-7 text-[#444654]">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="atelier-panel">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="section-title">{t('dashboard.recentTitle')}</h2>
            <span className="status-pill bg-[#dde1ff] text-[#002c98]">
              <Globe size={14} />
              ES/EN
            </span>
          </div>
          <div className="space-y-4">
            {status.map((item) => (
              <div className="flex items-start gap-3 rounded-[22px] bg-[#f5f4e8] p-4" key={item}>
                <CircleCheckBig className="mt-1 text-[#1b6d24]" size={18} />
                <p className="text-sm leading-7 text-[#444654]">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
