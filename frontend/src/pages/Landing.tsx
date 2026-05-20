import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Zap, MapPin, Clock, Star, ArrowRight, Wrench,
  Car, Hammer, Paintbrush, Sparkles, Shield, Flame,
  ChevronRight, Users, Briefcase
} from 'lucide-react'

const CATEGORIES = [
  { icon: '⚡', label: 'Electrician', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
  { icon: '🔧', label: 'Plumber', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
  { icon: '🚗', label: 'Driver', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  { icon: '🙏', label: 'Purohit', color: '#f472b6', bg: 'rgba(244,114,182,0.08)' },
  { icon: '🪚', label: 'Carpenter', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
  { icon: '🎨', label: 'Painter', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  { icon: '🧹', label: 'Cleaner', color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)' },
  { icon: '🔩', label: 'Mechanic', color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
]

const STATS = [
  { value: '10K+', label: 'Active Agents', icon: Users },
  { value: '50K+', label: 'Jobs Completed', icon: Briefcase },
  { value: '4.8★', label: 'Avg Rating', icon: Star },
  { value: '< 5 min', label: 'Response Time', icon: Clock },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Post Your Job',
    desc: 'Describe what you need — grinder repair, plumbing, electrical, anything.',
    icon: Briefcase,
    color: '#ff6b35',
  },
  {
    step: '02',
    title: 'Get Matched',
    desc: 'Nearby skilled agents see your post and apply instantly.',
    icon: MapPin,
    color: '#00d4ff',
  },
  {
    step: '03',
    title: 'Work Gets Done',
    desc: 'Accept, track live, and pay only when the job is complete.',
    icon: Zap,
    color: '#7c3aed',
  },
]

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #ff6b35, transparent)' }}
          />
          <div
            className="absolute top-1/3 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }}
          />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(ellipse, #7c3aed, transparent)' }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center animate-fadeInUp">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 text-sm">
            <span className="pulse-dot-orange" />
            <span style={{ color: 'var(--text-muted)' }}>Real-time location-based services</span>
            <span className="font-semibold" style={{ color: '#ff6b35' }}>Now live</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 leading-none">
            Employment for
            <br />
            <span className="gradient-text">Every Human,</span>
            <br />
            <span className="text-slate-300">Everywhere.</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)', lineHeight: '1.7' }}>
            Find skilled electricians, plumbers, drivers & more near you — right now.
            Post a job, get matched instantly, track live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/jobs" className="btn-primary text-base px-8 py-3">
                  Browse Jobs <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="btn-secondary text-base px-8 py-3">
                  My Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary text-base px-8 py-3">
                  Post a Job <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register?role=agent" className="btn-secondary text-base px-8 py-3">
                  Join as Agent 🔧
                </Link>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="glass rounded-xl p-4 card-hover">
                  <Icon className="w-5 h-5 mb-2 mx-auto" style={{ color: '#ff6b35' }} />
                  <div className="text-2xl font-black gradient-text">{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Every Service, <span className="gradient-text">One Platform</span>
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>From emergency repairs to scheduled home services</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={`/jobs?category=${cat.label.toLowerCase()}`}
                className="glass rounded-2xl p-6 card-hover group cursor-pointer text-center"
                style={{ border: `1px solid ${cat.color}15` }}
              >
                <div
                  className="text-4xl mb-3 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110"
                  style={{ background: cat.bg }}
                >
                  {cat.icon}
                </div>
                <p className="font-semibold text-sm" style={{ color: cat.color }}>{cat.label}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4" style={{ background: 'rgba(15,22,41,0.5)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              How <span className="gradient-text">Karmaphala</span> Works
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Three simple steps to get any job done</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-12 left-1/4 right-1/4 h-px"
              style={{ background: 'linear-gradient(90deg, #ff6b35, #00d4ff)' }} />

            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="glass rounded-2xl p-8 card-hover relative z-10" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <div className="text-xs font-black mb-2" style={{ color: step.color }}>{step.step}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12" style={{ border: '1px solid rgba(255,107,53,0.15)' }}>
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold mb-3">
              Ready to <span className="gradient-text">Get Started?</span>
            </h2>
            <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
              Join thousands of customers and skilled agents already using Karmaphala.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base px-8 py-3">
                I need a Service
              </Link>
              <Link to="/register?role=agent" className="btn-secondary text-base px-8 py-3">
                I offer Services 🔧
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4" style={{ color: '#ff6b35' }} />
          <span className="font-bold gradient-text">Karmaphala</span>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Employment for every human, everywhere. Built with ❤️
        </p>
      </footer>
    </div>
  )
}

export default LandingPage
