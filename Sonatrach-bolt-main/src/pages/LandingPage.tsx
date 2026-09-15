/*import { ArrowRight, CheckCircle2, Factory, Gauge, Info, LockKeyhole, ShieldCheck, Wrench } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';

const units = [{ icon: Factory, title: 'Topping & Distillation', detail: 'Séparation initiale du brut et surveillance thermique des colonnes.' }, { icon: Gauge, title: 'Reforming catalytique', detail: "Suivi des fours réactionnels, compresseurs et régénération du catalyseur." }, { icon: Wrench, title: "Unités d'hydrotraitement", detail: 'Désulfuration des distillats, contrôle haute pression et instrumentation.' }, { icon: Factory, title: 'Utilités & stockage', detail: 'Vapeur, eau industrielle, air comprimé et parc de bacs produits.' }];

export function LandingPage() { return <AppShell active="home"><main><section className="hero-grid relative overflow-hidden border-b border-slate-200 bg-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(244,121,32,.1),transparent_65%)]" /><div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:py-28"><span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-sonatrach"><span className="h-2 w-2 animate-pulse rounded-full bg-sonatrach" /> Plateforme institutionnelle de maintenance</span><h1 className="heading mt-6 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-6xl"> La maintenance Sonatrach , <span className="text-sonatrach"> en temps réel.</span></h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Un espace centralisé pour suivre les ordres de travail, coordonner les équipes et préserver la disponibilité des unités de la Raffinerie d'Alger.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button onClick={() => navigate('login')} className="group inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-sonatrach-600">Accéder à l'espace de travail <ArrowRight size={17} className="transition group-hover:translate-x-1" /></button><a href="#perimetre" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"><Info size={17} /> Découvrir le périmètre</a></div><div className="mt-8 flex flex-wrap justify-center gap-5 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-sonatrach" /> Normes ATEX & HSE</span><span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Disponibilité 24/7</span></div></div></section><section className="border-b border-slate-200 bg-white py-12"><div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-3 lg:px-8">{[['Disponibilité globale','98.4 %','+0.6% ce mois','text-sonatrach'],['Conformité sécurité & HSE','100 %','Permis validés','text-emerald-600'],['Clôture des ordres de travail','94.8 %','Délai moyen < 24h','text-sky-600']].map(([label,value,detail,color]) => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className={`heading mt-2 text-3xl font-extrabold ${color}`}>{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>)}</div></section><section id="perimetre" className="bg-slate-50 py-16"><div className="mx-auto max-w-7xl px-4 lg:px-8"><div className="mx-auto mb-10 max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Infrastructures industrielles</p><h2 className="heading mt-2 text-3xl font-extrabold text-slate-950">Périmètre opérationnel</h2><p className="mt-3 text-sm leading-6 text-slate-600">Une supervision rigoureuse de l'ensemble des installations de traitement du brut et des utilités.</p></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{units.map(unit => <div key={unit.title} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-soft"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-sonatrach"><unit.icon size={21} /></div><h3 className="font-bold text-slate-900">{unit.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{unit.detail}</p></div>)}</div></div></section><section className="border-t border-slate-200 bg-white py-16"><div className="mx-auto grid max-w-7xl items-center gap-8 px-4 md:grid-cols-2 lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sonatrach">Prêt à intervenir ?</p><h2 className="heading mt-3 text-3xl font-extrabold text-slate-950">Retrouvez votre environnement de travail.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">Consultez les alertes, visualisez les priorités du quart et créez un nouvel ordre de travail depuis un espace sécurisé.</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-soft"><div className="flex items-start gap-3"><div className="rounded-lg bg-orange-100 p-3 text-sonatrach"><LockKeyhole size={21} /></div><div><h3 className="font-bold text-slate-900">Accéder à mon espace </h3><p className="mt-1 text-sm text-slate-500">Connexion sécurisée au système de maintenance GMAO.</p></div></div><button onClick={() => navigate('login')} className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Mon espace de travail</button></div></div></section></main></AppShell>; }

*/
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Factory, Gauge, Info, LockKeyhole, Settings, ShieldCheck, Wrench } from 'lucide-react';
import { AppShell, navigate } from '@/components/Shell';

const stats = [
  { icon: Factory, value: '12', label: 'Unités suivies' },
  { icon: ClipboardList, value: '148', label: 'Ordres de travail' },
  { icon: Settings, value: '27', label: 'Interventions en cours' },
  { icon: Clock, value: '96,8 %', label: 'Disponibilité' },
];

const units = [
  { icon: Factory, title: 'Topping & Distillation', detail: 'Séparation initiale du brut et surveillance thermique des colonnes.' },
  { icon: Gauge, title: 'Reforming catalytique', detail: 'Suivi des fours réactionnels, compresseurs et régénération du catalyseur.' },
  { icon: Wrench, title: "Unités d'hydrotraitement", detail: 'Désulfuration des distillats, contrôle haute pression et instrumentation.' },
  { icon: Factory, title: 'Utilités & stockage', detail: 'Vapeur, eau industrielle, air comprimé et parc de bacs produits.' },
];

export function LandingPage() {
  return (
    <AppShell active="home">
      <main>
        {/* HÉRO */}
        <section className="hero-grid relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(244,121,32,.08),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-20">
            {/* Colonne texte */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-sonatrach">
                <span className="h-2 w-2 animate-pulse rounded-full bg-sonatrach" /> Plateforme institutionnelle de maintenance
              </span>
              <h1 className="heading mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl xl:text-6xl">
                La maintenance Sonatrach,<br />
                <span className="text-sonatrach">en temps réel.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Un espace centralisé pour suivre les ordres de travail, coordonner les équipes et préserver la disponibilité des unités de la Raffinerie d'Alger.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('login')}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-sonatrach px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-sonatrach-600"
                >
                  Accéder à l'espace de travail <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </button>
                <a
                  href="#perimetre"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <Info size={17} /> Découvrir le périmètre
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-sonatrach" /> Normes ATEX & HSE</span>
                <span className="h-4 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Disponibilité 24/7</span>
              </div>
            </div>

            {/* Colonne image en biais */}
            <div className="relative lg:-mr-8 xl:-mr-16">
              <div className="absolute -left-3 top-8 bottom-8 hidden w-24 bg-sonatrach/90 lg:block lg:[clip-path:polygon(35%_0,100%_0,65%_100%,0_100%)]" />
              <img
                src="/src/assets/images.jfif"
                alt="Raffinerie d'Alger au crépuscule"
                className="relative h-64 w-full rounded-2xl object-cover shadow-xl sm:h-80 lg:h-[440px] lg:rounded-3xl lg:[clip-path:polygon(10%_0,100%_0,100%_100%,0_100%)]"
              />
            </div>
          </div>
        </section>

        {/* CARTE STATISTIQUES */}
        <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-6 rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-xl shadow-slate-200/60 lg:grid-cols-4 lg:divide-x lg:divide-slate-100">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3 px-2 lg:justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-sonatrach">
                    <Icon size={22} />
                  </span>
                  <span>
                    <span className="block text-2xl font-extrabold text-slate-950">{s.value}</span>
                    <span className="block text-xs font-medium text-slate-500">{s.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PÉRIMÈTRE OPÉRATIONNEL */}
        <section id="perimetre" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-sonatrach">
              <span className="h-px w-8 bg-orange-300" /> Infrastructures industrielles <span className="h-px w-8 bg-orange-300" />
            </span>
            <h2 className="heading mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Périmètre opérationnel</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
              Une supervision rigoureuse de l'ensemble des installations de traitement du brut et des utilités.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {units.map(unit => {
              const Icon = unit.icon;
              return (
                <div
                  key={unit.title}
                  className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-sonatrach">
                    <Icon size={24} />
                  </span>
                  <h3 className="mt-5 text-base font-bold text-slate-900">{unit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{unit.detail}</p>
                  <span className="mt-6 flex justify-end">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:bg-sonatrach">
                      <ArrowRight size={16} />
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* BANDE CTA /src/assets/raffinerie-alger.png */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-6 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm lg:grid-cols-[220px_1fr_320px] lg:p-6">
            {/* APRÈS */}
            <div className="relative h-40 overflow-hidden rounded-2xl lg:h-full">
             <img src="/src/assets/raffinerie-alger.png" alt="Installations de la raffinerie" className="h-full w-full object-cover" />
                </div>

            <div className="px-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-sonatrach">Prêt à intervenir ?</p>
              <h3 className="heading mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Retrouvez votre environnement de travail.
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
                Consultez les alertes, visualisez les priorités du quart et créez un nouvel ordre de travail depuis un espace sécurisé.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-sonatrach">
                <LockKeyhole size={22} />
              </span>
              <p className="mt-4 text-sm font-bold text-slate-900">Accéder à mon espace</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Connexion sécurisée au système de maintenance GMAO.</p>
              <button
                onClick={() => navigate('login')}
                className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Mon espace de travail <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}