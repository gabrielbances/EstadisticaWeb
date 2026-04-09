import { ArrowRight, CheckCircle2, FileSpreadsheet, Globe, GraduationCap, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brand } from '../components/Brand'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type InfoCard = {
  title: string
  body: string
  icon: typeof FileSpreadsheet
}

export function LandingPage() {
  const { t } = useTranslation()

  const benefits: InfoCard[] = [
    {
      title: t('landing.benefit1Title'),
      body: t('landing.benefit1Body'),
      icon: FileSpreadsheet,
    },
    {
      title: t('landing.benefit2Title'),
      body: t('landing.benefit2Body'),
      icon: WandSparkles,
    },
    {
      title: t('landing.benefit3Title'),
      body: t('landing.benefit3Body'),
      icon: GraduationCap,
    },
    {
      title: t('landing.benefit4Title'),
      body: t('landing.benefit4Body'),
      icon: Globe,
    },
  ]

  const steps = [
    { title: t('landing.step1Title'), body: t('landing.step1Body') },
    { title: t('landing.step2Title'), body: t('landing.step2Body') },
    { title: t('landing.step3Title'), body: t('landing.step3Body') },
  ]

  return (
    <div className="atelier-page">
      <header className="flex items-center justify-between px-6 py-6 lg:px-12">
        <Brand />
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <Link className="atelier-outline-button" to="/auth">
            {t('common.signIn')}
          </Link>
        </div>
      </header>

      <main className="px-6 pb-16 lg:px-12">
        <section className="mx-auto grid max-w-7xl items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="eyebrow mb-5">{t('landing.badge')}</p>
            <h1 className="page-title max-w-4xl">
              {t('landing.titleA')} <span className="text-[#002c98]">{t('landing.titleB')}</span>{' '}
              {t('landing.titleC')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#444654]">
              {t('landing.description')}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link className="atelier-primary-button" to="/dashboard">
                {t('landing.ctaPrimary')}
                <ArrowRight size={16} />
              </Link>
              <Link className="atelier-outline-button" to="/auth">
                {t('landing.ctaSecondary')}
              </Link>
            </div>
            <p className="mt-8 max-w-xl text-sm leading-7 text-[#6c6d78]">
              {t('landing.trusted')}
            </p>
          </div>

          <div className="atelier-panel relative overflow-hidden">
            <div className="absolute right-[-4rem] top-[-3rem] h-44 w-44 rounded-full bg-[#dde1ff] blur-3xl" />
            <div className="absolute bottom-[-5rem] left-[-3rem] h-52 w-52 rounded-full bg-[#a0f399] opacity-40 blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] bg-[#002c98] p-6 text-white lg:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#dde1ff]">
                  {t('landing.workspaceLabel')}
                </p>
                <h2 className="font-headline text-3xl font-bold tracking-[-0.04em]">
                  {t('landing.workspaceTitle')}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-[#b2bfff]">
                  {t('landing.workspaceBody')}
                </p>
              </div>
              <div className="atelier-panel-soft">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
                  {t('landing.route1')}
                </p>
                <p className="mt-3 font-headline text-2xl font-bold">{t('landing.route1Title')}</p>
                <p className="mt-2 text-sm leading-6 text-[#444654]">
                  {t('landing.route1Body')}
                </p>
              </div>
              <div className="atelier-panel-soft">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c6d78]">
                  {t('landing.route2')}
                </p>
                <p className="mt-3 font-headline text-2xl font-bold">{t('landing.route2Title')}</p>
                <p className="mt-2 text-sm leading-6 text-[#444654]">
                  {t('landing.route2Body')}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-5 shadow-[0_14px_30px_rgba(27,28,21,0.04)] lg:col-span-2">
                <div className="mb-3 flex items-center justify-between">
                  <span className="status-pill bg-[#a0f399] text-[#005312]">
                    <CheckCircle2 size={14} />
                    {t('landing.desktopTablet')}
                  </span>
                  <LanguageSwitcher />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[#efeee3] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#6c6d78]">{t('landing.importLabel')}</p>
                    <p className="mt-2 text-2xl font-headline font-bold">{t('landing.importValue')}</p>
                  </div>
                  <div className="rounded-2xl bg-[#efeee3] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#6c6d78]">{t('landing.modeLabel')}</p>
                    <p className="mt-2 text-2xl font-headline font-bold">{t('landing.modeValue')}</p>
                  </div>
                  <div className="rounded-2xl bg-[#efeee3] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#6c6d78]">{t('landing.adminLabel')}</p>
                    <p className="mt-2 text-2xl font-headline font-bold">{t('landing.adminValue')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-16 max-w-7xl">
          <div className="mb-10">
            <p className="eyebrow">{t('landing.benefitsTitle')}</p>
            <h2 className="mt-3 section-title">{t('landing.benefitsSubtitle')}</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-4">
            {benefits.map(({ title, body, icon: Icon }) => (
              <article className="atelier-card" key={title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dde1ff] text-[#002c98]">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 font-headline text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#444654]">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl rounded-[36px] bg-[#f5f4e8] px-6 py-12 lg:px-10">
          <div className="mb-12 text-center">
            <p className="eyebrow">{t('landing.howTitle')}</p>
            <h2 className="mt-3 section-title">{t('landing.howSubtitle')}</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article className="atelier-card" key={step.title}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#a0f399] font-headline font-bold text-[#005312]">
                  {index + 1}
                </div>
                <h3 className="font-headline text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#444654]">{step.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
