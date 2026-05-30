import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { VIDEOS } from '@/videos/registry';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg-dark text-text-inverse">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        <motion.div
          className="absolute -top-[40vh] -left-[30vw] w-[120vw] h-[120vh] opacity-20 blur-[120px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }}
          animate={{ x: ['0%', '8%', '-4%', '0%'], y: ['0%', '-4%', '8%', '0%'], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-[40vh] -right-[30vw] w-[120vw] h-[120vh] opacity-10 blur-[100px] rounded-full"
          style={{ background: 'radial-gradient(circle, var(--color-secondary), transparent 60%)' }}
          animate={{ x: ['0%', '-10%', '4%', '0%'], y: ['0%', '10%', '-4%', '0%'], scale: [1, 0.9, 1.15, 1] }}
          transition={{ duration: 27, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 py-16 md:py-24">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-14 text-center"
        >
          <span className="font-body text-xs uppercase tracking-[0.4em] text-secondary md:text-sm">
            Lectio · Reading Room
          </span>
          <h1 className="mt-4 font-display text-5xl font-medium leading-none md:text-7xl">
            Homer, read aloud
          </h1>
          <span className="mx-auto mt-5 block h-[1px] w-24 bg-secondary" />
          <p className="mx-auto mt-5 max-w-xl font-display text-lg italic text-text-muted md:text-xl">
            Four narrated passages in the original Greek, line by line with the English.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {VIDEOS.map((video, i) => (
            <motion.div
              key={video.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 + i * 0.08 }}
            >
              <Link
                href={`/${video.slug}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-300 hover:border-secondary/50 hover:bg-white/[0.06]"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img
                    src={`${import.meta.env.BASE_URL}${video.poster}`}
                    alt=""
                    className="h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />
                  <div className="absolute bottom-3 left-5">
                    <span className="font-display text-4xl font-medium text-text-inverse drop-shadow md:text-5xl">
                      {video.greekTitle}
                    </span>
                  </div>
                  <div className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-secondary/40 bg-black/30 text-secondary backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-secondary group-hover:bg-secondary/15">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px]" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <span className="font-body text-[0.7rem] uppercase tracking-[0.3em] text-secondary">
                    {video.work}
                  </span>
                  <h2 className="mt-1.5 font-display text-2xl font-medium leading-tight text-text-inverse">
                    {video.menuTitle}
                  </h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-text-muted">
                    {video.menuSubtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
