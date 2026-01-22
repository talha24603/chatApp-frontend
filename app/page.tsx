import Link from "next/link";

const features = [
  {
    title: "Context aware replies",
    body: "Keep every participant on the same page with live prompts that adapt to the conversation.",
  },
  {
    title: "Realtime sync",
    body: "Messages travel through our edge network so delivery stays under 50 ms worldwide.",
  },
  {
    title: "Secure by default",
    body: "E2E encryption, audit trails, and SOC2-ready logging, all baked in from day one.",
  },
];

const stats = [
  { label: "Avg. Response Time", value: "42 ms" },
  { label: "Teams onboarded", value: "2,100+" },
  { label: "Messages / day", value: "18M" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white font-sans dark:from-black dark:via-zinc-950 dark:to-zinc-950">
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-20 sm:px-10 lg:py-28">
        <section className="grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              Now accepting beta teams
              <span className="h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-300" />
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
              Chat that feels effortless, even when your team&apos;s distributed.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sora keeps your conversations flowing with latency-free messaging, smart summaries,
              and deep integrations with the tools you already ship with.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/40 transition hover:bg-indigo-500"
              >
                Launch the demo
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-200 dark:hover:border-zinc-600"
              >
                View product brief
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 text-sm text-zinc-500 dark:text-zinc-400">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs uppercase tracking-wide">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border border-zinc-100 bg-white/80 p-8 shadow-2xl shadow-indigo-500/10 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="absolute inset-y-0 right-0 w-1/2 rounded-l-full bg-gradient-to-l from-indigo-500/30 to-transparent blur-2xl" />
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-2xl border border-zinc-100/70 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/70">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300" />
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Product Team</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">We just shipped the AI routing upgrade 🎯</p>
                </div>
              </div>
              <div className="space-y-3 rounded-2xl bg-zinc-50/80 p-4 dark:bg-zinc-800/50">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Live summary</p>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
                  Deployment completed in 45 seconds. Ops confirmed zero errors. Next milestone: onboarding 5 new clients
                  before Friday.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Upcoming</p>
                <div className="mt-4 space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
                  <div className="flex items-center justify-between">
                    <span>Stand-up sync</span>
                    <span className="text-zinc-400">in 12 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Customer AMA</span>
                    <span className="text-zinc-400">4:00 PM PDT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Auto-summary export</span>
                    <span className="text-zinc-400">Tonight</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
              Why teams switch to Sora
            </p>
            <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Built for momentum</h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              From the first ping to the final decision, Sora gives remote teams the clarity, focus, and automation they
              need to move faster together.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-zinc-100 bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                  {feature.title}
                </p>
                <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-100 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 p-10 text-white shadow-xl dark:border-indigo-500/30">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Ready when you are</p>
              <h3 className="mt-4 text-3xl font-semibold leading-tight">Spin up your workspace in under 60 seconds.</h3>
              <p className="mt-4 text-base leading-relaxed text-white/80">
                Connect Slack, GitHub, Notion, and more. Route conversations by ownership or impact, and deliver AI
                summaries to anyone who missed the meeting.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-900/20 transition hover:bg-white/90"
              >
                Jump into chat
              </Link>
              <Link
                href="mailto:hey@sora.chat"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white hover:text-white"
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
