import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Companion from "../components/Companion";
import Particles from "../components/Particles";
import { ArrowRight, Mic, Sparkles, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="grain relative min-h-screen overflow-hidden">
      <Particles count={36} />

      {/* Hero */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center" data-testid="landing-hero">
        <div className="mb-10">
          <Companion state="idle" size={170} />
        </div>

        <p className="mb-4 font-body text-xs font-semibold uppercase tracking-[0.3em] text-white/55">
          mysl · ai body double
        </p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-display max-w-3xl text-5xl font-light leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl"
          data-testid="landing-headline"
        >
          someone in the room,<br />
          <span className="text-gradient italic">so your brain starts.</span>
        </motion.h1>

        <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-white/60 sm:text-lg">
          mysl sits with you while you work. talk out loud like you normally would —
          it pulls out your tasks and notes, and never makes you feel bad about losing time.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-body text-sm font-medium text-black transition hover:bg-white/90"
            data-testid="cta-start-session"
          >
            sit down with mysl
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/15 px-6 py-3 font-body text-sm text-white/70 transition hover:border-white/40 hover:text-white"
            data-testid="cta-sign-in"
          >
            i already have an account
          </Link>
        </div>

        <p className="mt-12 font-body text-[11px] text-white/30">free · always on · built for the brain that already tried everything</p>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 py-32" data-testid="landing-how">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-center font-body text-xs uppercase tracking-[0.3em] text-white/40">how it works</p>
          <h2 className="mb-16 text-center font-display text-4xl font-light text-white sm:text-5xl">
            you talk. <span className="italic text-white/60">it remembers.</span>
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { Icon: Mic, title: "talk out loud", body: "open mysl. start a session. say whatever's in your head — it doesn't have to be coherent." },
              { Icon: Sparkles, title: "tasks appear", body: "we pull out the actionable bits automatically. you don't write a thing." },
              { Icon: BookOpen, title: "patterns emerge", body: "over weeks, mysl notices when you focus best — and never uses it to shame you." },
            ].map(({ Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-3xl p-7"
              >
                <Icon size={20} className="mb-5 text-indigo-300/80" />
                <h3 className="mb-2 font-display text-xl text-white">{title}</h3>
                <p className="font-body text-sm leading-relaxed text-white/55">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For brains that... */}
      <section className="relative z-10 px-6 py-32" data-testid="landing-empathy">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 font-body text-xs uppercase tracking-[0.3em] text-white/40">built for</p>
          <h2 className="mb-12 font-display text-3xl font-light leading-tight text-white sm:text-4xl">
            the person who has tried <span className="italic">every productivity app</span> and failed —
            not because they&apos;re lazy, but because those apps were never built for them.
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-300/90 to-fuchsia-300/90 px-7 py-3 font-body text-sm font-medium text-black transition hover:from-indigo-200 hover:to-fuchsia-200"
            data-testid="cta-bottom"
          >
            try it now <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8 text-center font-body text-[11px] text-white/25">
        © {new Date().getFullYear()} mysl. quietly in your corner.
      </footer>
    </div>
  );
}
