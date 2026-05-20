import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Briefcase, Plus, Clock, CheckCircle, AlertTriangle,
  Star, TrendingUp, MapPin, Zap, Loader2, ToggleLeft, ToggleRight, User
} from 'lucide-react'

interface Job {
  _id: string
  title: string
  description: string
  category: string
  status: string
  priority: number
  isEmergency: boolean
  budget: number
  location: { address: string }
  createdAt: string
  postedBy: { name: string; email: string; phone?: string }
  applicants?: Array<{ agent: { _id: string; name: string; email: string; skills: string[]; rating: number; hourlyRate: number } }>
}

const CATEGORY_ICONS: Record<string, string> = {
  electrician: '⚡', plumber: '🔧', driver: '🚗', purohit: '🙏',
  carpenter: '🪚', painter: '🎨', cleaner: '🧹', mechanic: '🔩', other: '💼',
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [myJobs, setMyJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable || false)
  const [togglingAvail, setTogglingAvail] = useState(false)
  const [assigningJob, setAssigningJob] = useState<string | null>(null)

  useEffect(() => {
    fetchMyJobs()
  }, [])

  const fetchMyJobs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/jobs/my/posts')
      setMyJobs(res.data.jobs)
    } catch {
      toast.error('Failed to load your jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    if (user?.role !== 'agent') return
    setTogglingAvail(true)
    try {
      const res = await api.patch('/agents/me/availability')
      setIsAvailable(res.data.isAvailable)
      toast.success(res.data.message)
    } catch {
      toast.error('Failed to update availability')
    } finally {
      setTogglingAvail(false)
    }
  }

  const handleAssignAgent = async (jobId: string, agentId: string) => {
    setAssigningJob(jobId)
    try {
      await api.patch(`/jobs/${jobId}/assign`, { agentId })
      toast.success('Agent assigned! ✅')
      fetchMyJobs()
    } catch {
      toast.error('Failed to assign agent')
    } finally {
      setAssigningJob(null)
    }
  }

  const handleCompleteJob = async (jobId: string) => {
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: 'completed' })
      toast.success('Job marked as completed!')
      fetchMyJobs()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const openJobs = myJobs.filter((j) => j.status === 'open')
  const activeJobs = myJobs.filter((j) => ['assigned', 'in_progress'].includes(j.status))
  const completedJobs = myJobs.filter((j) => j.status === 'completed')

  return (
    <div className="min-h-screen pt-16" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="glass rounded-2xl p-6 mb-6 animate-fadeInUp" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl gradient-orange flex items-center justify-center glow-orange text-xl font-black text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black">
                  Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}! 👋</span>
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {user?.role === 'agent'
                    ? `Agent · ${user.skills?.join(', ') || 'No skills listed'}`
                    : 'Customer · Find & post service jobs'}
                </p>
              </div>
            </div>

            {/* Agent availability toggle */}
            {user?.role === 'agent' && (
              <button
                onClick={handleToggleAvailability}
                disabled={togglingAvail}
                className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all"
                style={{
                  background: isAvailable ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                  border: `1px solid ${isAvailable ? 'rgba(34,197,94,0.3)' : 'rgba(107,114,128,0.3)'}`,
                }}
              >
                <div className={isAvailable ? 'pulse-dot' : undefined}
                  style={!isAvailable ? { width: 10, height: 10, borderRadius: '50%', background: '#6b7280' } : undefined}
                />
                <span className="font-semibold text-sm" style={{ color: isAvailable ? '#22c55e' : '#6b7280' }}>
                  {togglingAvail ? 'Updating...' : isAvailable ? 'Available' : 'Offline'}
                </span>
                {isAvailable
                  ? <ToggleRight className="w-5 h-5" style={{ color: '#22c55e' }} />
                  : <ToggleLeft className="w-5 h-5" style={{ color: '#6b7280' }} />
                }
              </button>
            )}
          </div>

          {/* Stats row */}
          {user?.role === 'customer' && (
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Total Posted', value: myJobs.length, icon: Briefcase, color: '#ff6b35' },
                { label: 'Active', value: activeJobs.length, icon: Clock, color: '#00d4ff' },
                { label: 'Completed', value: completedJobs.length, icon: CheckCircle, color: '#22c55e' },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: stat.color }} />
                    <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Link
            to="/jobs"
            className="glass rounded-xl p-4 card-hover flex items-center gap-3"
            style={{ border: '1px solid rgba(255,107,53,0.15)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,53,0.1)' }}>
              {user?.role === 'customer' ? <Plus className="w-5 h-5" style={{ color: '#ff6b35' }} /> : <Briefcase className="w-5 h-5" style={{ color: '#ff6b35' }} />}
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.role === 'customer' ? 'Post a New Job' : 'Browse Job Feed'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {user?.role === 'customer' ? 'Find skilled agents near you' : 'Find jobs matching your skills'}
              </p>
            </div>
          </Link>

          <div className="glass rounded-xl p-4 flex items-center gap-3" style={{ border: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#00d4ff' }} />
            </div>
            <div>
              <p className="font-semibold text-sm">Platform Stats</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Jobs growing every day</p>
            </div>
          </div>
        </div>

        {/* My jobs section - customers only */}
        {user?.role === 'customer' && (
          <div className="space-y-6">
            {/* Open Jobs */}
            {openJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center text-xs">🟢</span>
                  Open Jobs ({openJobs.length})
                </h2>
                <div className="space-y-3">
                  {openJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onAssign={handleAssignAgent}
                      onComplete={handleCompleteJob}
                      assigning={assigningJob === job._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#00d4ff' }} />
                  Active Jobs ({activeJobs.length})
                </h2>
                <div className="space-y-3">
                  {activeJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onAssign={handleAssignAgent}
                      onComplete={handleCompleteJob}
                      assigning={assigningJob === job._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedJobs.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                  Completed ({completedJobs.length})
                </h2>
                <div className="space-y-3">
                  {completedJobs.map((job) => (
                    <JobCard
                      key={job._id}
                      job={job}
                      onAssign={handleAssignAgent}
                      onComplete={handleCompleteJob}
                      assigning={assigningJob === job._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#ff6b35' }} />
              </div>
            )}

            {!loading && myJobs.length === 0 && (
              <div className="text-center py-16 glass rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                <div className="text-5xl mb-3">📋</div>
                <h3 className="font-semibold mb-1">No jobs yet</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Post your first job to get started</p>
                <Link to="/jobs" className="btn-primary text-sm">
                  <Plus className="w-4 h-4" /> Post a Job
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Agent dashboard — show job feed link */}
        {user?.role === 'agent' && (
          <div className="glass rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(0,212,255,0.15)' }}>
            <div className="text-5xl mb-4">🔧</div>
            <h2 className="text-xl font-bold mb-2">Ready to Work?</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Browse open jobs that match your skills{isAvailable ? ' — you are currently online!' : '. Toggle availability to start receiving jobs.'}
            </p>
            <Link to="/jobs" className="btn-cyan text-sm px-8 py-3">
              Browse Available Jobs →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Job Card sub-component ────────────────────────────────────────────────────
interface JobCardProps {
  job: Job
  onAssign: (jobId: string, agentId: string) => void
  onComplete: (jobId: string) => void
  assigning: boolean
}

const JobCard = ({ job, onAssign, onComplete, assigning }: JobCardProps) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass rounded-xl p-4 card-hover" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {CATEGORY_ICONS[job.category] || '💼'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{job.title}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize
              ${job.status === 'open' ? 'status-open' : ''}
              ${job.status === 'assigned' ? 'status-assigned' : ''}
              ${job.status === 'in_progress' ? 'status-in_progress' : ''}
              ${job.status === 'completed' ? 'status-completed' : ''}
            `}>
              {job.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="category-pill text-xs">{job.category}</span>
            {job.location?.address && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3 h-3" />{job.location.address}
              </span>
            )}
            {job.isEmergency && <span className="badge-emergency">🚨 Emergency</span>}
          </div>
        </div>
      </div>

      {/* Applicants */}
      {job.applicants && job.applicants.length > 0 && job.status === 'open' && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
            style={{ color: '#ff6b35' }}
          >
            👥 {job.applicants.length} Applicant{job.applicants.length !== 1 ? 's' : ''} · {expanded ? 'Hide' : 'View'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-2">
              {job.applicants.map((app) => {
                const agent = app.agent
                if (!agent || typeof agent === 'string') return null
                return (
                  <div
                    key={agent._id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-orange flex items-center justify-center text-xs font-bold text-white">
                        {agent.name?.[0]}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{agent.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                          {agent.skills?.join(', ') || 'N/A'} · ⭐ {agent.rating || 0} · ₹{agent.hourlyRate || 0}/hr
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAssign(job._id, agent._id)}
                      disabled={assigning}
                      className="btn-cyan text-xs py-1 px-3"
                      style={{ opacity: assigning ? 0.7 : 1 }}
                    >
                      {assigning ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Assign'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Complete button for active jobs */}
      {['assigned', 'in_progress'].includes(job.status) && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => onComplete(job._id)}
            className="text-xs font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            style={{ color: '#22c55e' }}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Mark as Completed
          </button>
        </div>
      )}
    </div>
  )
}

export default Dashboard
