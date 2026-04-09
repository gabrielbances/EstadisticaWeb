import { Download, FileSpreadsheet, NotebookTabs, Sigma } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ResultsPage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      <section className="max-w-5xl">
        <p className="eyebrow mb-3">{t('common.results')}</p>
        <h1 className="page-title">{t('resultsPage.title')}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444654]">
          {t('resultsPage.subtitle')}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="atelier-card">
          <FileSpreadsheet className="text-[#002c98]" size={24} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('resultsPage.block1')}
          </p>
          <p className="mt-3 font-headline text-2xl font-bold">datos_estudio.xlsx</p>
        </article>
        <article className="atelier-card">
          <NotebookTabs className="text-[#1b6d24]" size={24} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('resultsPage.block2')}
          </p>
          <p className="mt-3 font-headline text-2xl font-bold">ANOVA</p>
        </article>
        <article className="atelier-card">
          <Sigma className="text-[#002c98]" size={24} />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
            {t('resultsPage.block3')}
          </p>
          <p className="mt-3 font-headline text-2xl font-bold">RV = 13.17</p>
        </article>
      </section>

      <section className="atelier-panel flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="section-title">{t('common.export')}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#444654]">
            La exportación final integrará datos originales, tabla ANOVA o Chi-cuadrado y el resumen de salida en un libro de Excel.
          </p>
        </div>
        <button className="atelier-primary-button" type="button">
          {t('resultsPage.download')}
          <Download size={16} />
        </button>
      </section>
    </div>
  )
}
