import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'
import {
  Search, Plus, MapPin, Calendar, Loader2, Briefcase,
  RefreshCw, AlertTriangle, ChevronDown, Zap, Wifi, WifiOff
} from 'lucide-react'

const CATEGORIES = ['all', 'electrician', 'plumber', 'driver', 'purohit', 'carpenter', 'painter', 'cleaner', 'mechanic']

const CATEGORY_ICONS: Record<string, string> = {
  electrician: '⚡', plumber: '🔧', driver: '🚗', purohit: '🙏',
  carpenter: '🪚', painter: '🎨', cleaner: '🧹', mechanic: '🔩', other: '💼', all: '🔍',
}

interface Job {
  _id: string
  title: string
  description: string
  category: string
  isEmergency: boolean
  budget: number
  priority: number
  status: string
  location: { address: string }
  scheduledAt?: string
  createdAt: string
  postedBy: { name: string; email: string; phone?: string }
  applicants: Array<{ agent: string }>
  _isNew?: boolean // local flag for flash animation
}

const PriorityBadge = ({ priority }: { priority: number }) => {
  const map = {
    1: { label: '🚨 Emergency', cls: 'badge-priority-1' },
    2: { label: '📅 Scheduled', cls: 'badge-priority-2' },
    3: { label: 'Standard',     cls: 'badge-priority-3' },
  }
  const { label, cls } = map[priority as keyof typeof map] ?? map[3]
  return <span className={cls}>{label}</span>
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
}

const JobFeedPage = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showPostModal, setShowPostModal] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)
  const [newJobCount, setNewJobCount] = useState(0)
  const newJobsRef = useRef<string[]>([]) // track IDs of new live-arrived jobs

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (activeCategory !== 'all') params.category = activeCategory
      if (search) params.search = search
      const res = await api.get('/jobs', { params })
      setJobs(res.data.jobs)
      setNewJobCount(0)
      newJobsRef.current = []
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [activeCategory, search])

  // ── Initial fetch ──────────────────────────────────────────────
  useEffect(() => { fetchJobs() }, [fetchJobs])

  // ── Socket.io live listeners ───────────────────────────────────
  useEffect(() => {
    if (!socket) return

    // New job posted by someone else → prepend to feed
    const onNewJob = (job: Job) => {
      // skip if the job was posted by the current user (already added optimistically)
      if (job.postedBy?.email === user?.email) return

      // Only show if it matches current filter
      if (activeCategory !== 'all' && job.category !== activeCategory) return

      setJobs((prev) => {
        // avoid duplicate
        if (prev.find((j) => j._id === job._id)) return prev
        newJobsRef.current.push(job._id)
        setNewJobCount((c) => c + 1)
        return [{ ...job, _isNew: true }, ...prev]
      })

      toast(`📢 New job: ${job.title}`, {
        icon: '⚡',
        style: { background: 'rgba(255,107,53,0.9)', color: '#fff', fontWeight: 600 },
        duration: 4000,
      })

      // Remove flash flag after animation
      setTimeout(() => {
        setJobs((prev) =>
          prev.map((j) => (j._id === job._id ? { ...j, _isNew: false } : j))
        )
        newJobsRef.current = newJobsRef.current.filter((id) => id !== job._id)
      }, 1500)
    }

    // Applicant count update
    const onJobUpdated = ({ jobId, applicantCount }: { jobId: string; applicantCount: number }) => {
      setJobs((prev) =>
        prev.map((j) =>
          j._id === jobId
            ? { ...j, applicants: Array.from({ length: applicantCount }, (_, i) => ({ agent: `${i}` })) }
            : j
        )
      )
    }

    // Status changed
    const onStatusChange = ({ jobId, status }: { jobId: string; status: string }) => {
      setJobs((prev) =>
        prev.map((j) => (j._id === jobId ? { ...j, status } : j))
      )
    }

    // Agent applied for your job — notify if you're the customer
    const onApplied = ({ jobTitle, agentName }: { jobId: string; jobTitle: string; agentName: string }) => {
      if (user?.role === 'customer') {
        toast(`🔔 ${agentName} applied for "${jobTitle}"`, {
          icon: '👷',
          duration: 5000,
        })
      }
    }

    socket.on('job:new',          onNewJob)
    socket.on('job:updated',      onJobUpdated)
    socket.on('job:statusChange', onStatusChange)
    socket.on('job:applied',      onApplied)

    return () => {
      socket.off('job:new',          onNewJob)
      socket.off('job:updated',      onJobUpdated)
      socket.off('job:statusChange', onStatusChange)
      socket.off('job:applied',      onApplied)
    }
  }, [socket, activeCategory, user?.email, user?.role])

  const handleApply = async (jobId: string) => {
    if (user?.role !== 'agent') return toast.error('Only agents can apply for jobs')
    setApplying(jobId)
    try {
      await api.post(`/jobs/${jobId}/apply`, { message: 'I am available and qualified for this job.' })
      toast.success('Application sent! ✅')
      // Optimistically update local state
      setJobs((prev) =>
        prev.map((j) =>
          j._id === jobId
            ? { ...j, applicants: [...j.applicants, { agent: user._id }] }
            : j
        )
      )
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(null)
    }
  }

  const hasApplied = (job: Job) =>
    job.applicants?.some((a: any) => a.agent === user?._id || a.agent?._id === user?._id)

  const handleJobPosted = (newJob: Job) => {
    // Optimistic prepend so the poster sees it immediately too
    setJobs((prev) => [{ ...newJob, _isNew: true }, ...prev])
    setTimeout(() => {
      setJobs((prev) => prev.map((j) => (j._id === newJob._id ? { ...j, _isNew: false } : j)))
    }, 1500)
  }

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Sticky Header ─────────────────────────────── */}
      <div
        className="sticky top-16 z-40 glass-dark px-4 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Job Feed
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {jobs.length} job{jobs.length !== 1 ? 's' : ''} available
                  {newJobCount > 0 && (
                    <span className="ml-2 text-orange-400 font-semibold">
                      +{newJobCount} new
                    </span>
                  )}
                </p>
              </div>

              {/* ── LIVE indicator ──────────────────── */}
              <div className={`live-badge ${!isConnected ? 'opacity-40' : ''}`}>
                <span className={isConnected ? 'live-dot' : undefined}
                  style={!isConnected ? { width: 6, height: 6, borderRadius: '50%', background: '#6b7280' } : undefined}
                />
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobs}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)', border: '1px solid var(--border)' }}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {user?.role === 'customer' && (
                <button onClick={() => setShowPostModal(true)} className="btn-primary text-sm py-2">
                  <Plus className="w-4 h-4" />
                  Post Job
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, descriptions..."
              className="input-field pl-9 text-sm"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all capitalize"
                style={{
                  background: activeCategory === cat ? 'rgba(255,107,53,0.15)' : 'var(--glass-bg)',
                  color: activeCategory === cat ? '#ff6b35' : 'var(--text-muted)',
                  border: `1px solid ${activeCategory === cat ? 'rgba(255,107,53,0.3)' : 'var(--border)'}`,
                }}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat === 'all' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Job List ──────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#ff6b35' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-6xl">📭</div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No jobs found</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {user?.role === 'customer' ? 'Be the first to post a job!' : 'Check back soon for new opportunities'}
            </p>
            {user?.role === 'customer' && (
              <button onClick={() => setShowPostModal(true)} className="btn-primary text-sm mt-2">
                <Plus className="w-4 h-4" /> Post a Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job, i) => (
              <div
                key={job._id}
                className={`glass rounded-2xl p-5 card-hover animate-fadeInUp ${job._isNew ? 'new-job-flash' : ''}`}
                style={{
                  border: job.isEmergency
                    ? '1px solid rgba(239,68,68,0.3)'
                    : '1px solid var(--border)',
                  background: job.isEmergency ? 'rgba(239,68,68,0.03)' : undefined,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}
                    >
                      {CATEGORY_ICONS[job.category] || '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {job.title}
                        </h3>
                        {job._isNew && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,107,53,0.15)', color: '#ff6b35' }}>
                            ✨ New
                          </span>
                        )}
                        {job.isEmergency && (
                          <span className="badge-emergency flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Emergency
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        by {job.postedBy?.name} · {timeAgo(job.createdAt)}
                      </p>
                    </div>
                  </div>
                  <PriorityBadge priority={job.priority} />
                </div>

                <p className="text-sm mb-4 leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                  {job.description}
                </p>

                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <span className="category-pill">{CATEGORY_ICONS[job.category]} {job.category}</span>
                  {job.location?.address && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <MapPin className="w-3 h-3" /> {job.location.address}
                    </span>
                  )}
                  {job.budget > 0 && (
                    <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>
                      ₹{job.budget.toLocaleString()}
                    </span>
                  )}
                  {job.scheduledAt && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#eab308' }}>
                      <Calendar className="w-3 h-3" />
                      {new Date(job.scheduledAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Briefcase className="w-3 h-3" />
                    {job.applicants?.length || 0} applicant{(job.applicants?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <span className={`capitalize ${
                    job.status === 'open' ? 'status-open'
                    : job.status === 'assigned' ? 'status-assigned'
                    : job.status === 'in_progress' ? 'status-in_progress'
                    : 'status-completed'
                  }`}>
                    {job.status === 'open' ? '🟢 Open' : `🔵 ${job.status}`}
                  </span>

                  {user?.role === 'agent' && job.status === 'open' && (
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applying === job._id || hasApplied(job)}
                      className={hasApplied(job) ? 'btn-secondary text-sm py-1.5 px-4 opacity-60' : 'btn-primary text-sm py-1.5 px-4'}
                      style={{ opacity: applying === job._id ? 0.7 : undefined }}
                    >
                      {applying === job._id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : hasApplied(job) ? '✓ Applied'
                        : 'Apply Now →'}
                    </button>
                  )}

                  {user?.role === 'customer' && job.postedBy?.email === user?.email && (
                    <Link to={`/dashboard`} className="btn-secondary text-sm py-1.5 px-4">
                      Manage →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPostModal && (
        <PostJobModal
          onClose={() => setShowPostModal(false)}
          onSuccess={handleJobPosted}
        />
      )}
    </div>
  )
}

// ─── Post Job Modal ────────────────────────────────────────────────────────────
const CATEGORY_LIST = ['electrician', 'plumber', 'driver', 'purohit', 'carpenter', 'painter', 'cleaner', 'mechanic', 'other']

interface PostJobModalProps {
  onClose: () => void
  onSuccess: (job: any) => void
}

const PostJobModal = ({ onClose, onSuccess }: PostJobModalProps) => {
  const [form, setForm] = useState({
    title: '', description: '', category: 'electrician',
    budget: '', address: '', isEmergency: false, scheduledAt: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.address) return toast.error('Fill all required fields')
    setLoading(true)
    try {
      const res = await api.post('/jobs', {
        title: form.title, description: form.description,
        category: form.category, budget: Number(form.budget) || 0,
        isEmergency: form.isEmergency,
        scheduledAt: form.scheduledAt || null,
        location: { address: form.address, coordinates: [0, 0] },
      })
      toast.success('Job posted! 🎉 Agents can see it now')
      onSuccess(res.data.job)
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg glass rounded-2xl p-6 animate-slideInDown"
        style={{ border: '1px solid var(--border)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Post a New Job</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Broadcasts <span className="live-badge ml-1">
                <span className="live-dot" />LIVE
              </span> to nearby agents
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/5 transition-colors"
            style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Job Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Fix grinder at home" className="input-field" required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Category *</label>
            <div className="relative">
              <select name="category" value={form.category} onChange={handleChange} className="input-field appearance-none pr-8 capitalize">
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c} style={{ background: 'var(--bg-secondary)' }} className="capitalize">
                    {CATEGORY_ICONS[c]} {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Description *</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the work needed in detail..." className="input-field resize-none" rows={4} required />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input name="address" value={form.address} onChange={handleChange} placeholder="123 Anna Nagar, Chennai" className="input-field pl-9" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Budget (₹)</label>
              <input name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Schedule (optional)</label>
              <input name="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={handleChange} className="input-field text-xs" />
            </div>
          </div>

          <label
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{
              border: '1px solid rgba(239,68,68,0.15)',
              background: form.isEmergency ? 'rgba(239,68,68,0.06)' : 'transparent',
            }}
          >
            <input name="isEmergency" type="checkbox" checked={form.isEmergency} onChange={handleChange} className="w-4 h-4 accent-red-500" />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>🚨 Mark as Emergency</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gets highest priority in agent queues</p>
            </div>
          </label>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-3 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 justify-center" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Post Job</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JobFeedPage
