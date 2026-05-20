import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, User, Mail, Lock, Phone, Wrench, ChevronDown, ArrowRight } from 'lucide-react'

const SKILLS = ['electrician', 'plumber', 'driver', 'purohit', 'carpenter', 'painter', 'cleaner', 'mechanic']

const RegisterPage = () => {
  const [searchParams] = useSearchParams()
  const defaultRole = (searchParams.get('role') as 'customer' | 'agent') || 'customer'

  const [role, setRole] = useState<'customer' | 'agent'>(defaultRole)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    hourlyRate: '',
    serviceRadius: '5',
  })
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.password) {
      return toast.error('Please fill all required fields')
    }
    if (role === 'agent' && selectedSkills.length === 0) {
      return toast.error('Select at least one skill')
    }

    setLoading(true)
    try {
      await register({
        ...formData,
        role,
        skills: selectedSkills,
        hourlyRate: Number(formData.hourlyRate) || 0,
        serviceRadius: Number(formData.serviceRadius) || 5,
      })
      toast.success('Welcome to Karmaphala! 🎉')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24" style={{ background: 'var(--bg-primary)' }}>
      {/* Background orb */}
      <div
        className="fixed top-0 right-0 w-96 h-96 opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
      />

      <div className="w-full max-w-lg animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-orange flex items-center justify-center glow-orange">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">Karmaphala</span>
          </Link>
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#ff6b35' }}>
              Login
            </Link>
          </p>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8" style={{ border: '1px solid var(--border)' }}>
          {/* Role selector */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['customer', 'agent'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: role === r ? (r === 'agent' ? 'rgba(0,212,255,0.15)' : 'rgba(255,107,53,0.15)') : 'transparent',
                  color: role === r ? (r === 'agent' ? '#00d4ff' : '#ff6b35') : 'var(--text-muted)',
                  border: role === r ? `1px solid ${r === 'agent' ? 'rgba(0,212,255,0.3)' : 'rgba(255,107,53,0.3)'}` : '1px solid transparent',
                }}
              >
                {r === 'customer' ? '👤 Customer' : '🔧 Agent'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Rakshan Kumar"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="input-field pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Phone (optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="input-field pl-9"
                />
              </div>
            </div>

            {/* Agent-specific fields */}
            {role === 'agent' && (
              <>
                {/* Skills */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    Your Skills * <span className="font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all"
                        style={{
                          background: selectedSkills.includes(skill) ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
                          color: selectedSkills.includes(skill) ? '#00d4ff' : 'var(--text-muted)',
                          border: `1px solid ${selectedSkills.includes(skill) ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hourly rate + service radius */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Hourly Rate (₹)</label>
                    <input
                      name="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      placeholder="e.g. 300"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Service Radius (km)</label>
                    <input
                      name="serviceRadius"
                      type="number"
                      value={formData.serviceRadius}
                      onChange={handleChange}
                      placeholder="5"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Bio (optional)</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell customers about your experience..."
                    className="input-field resize-none"
                    rows={3}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          By registering you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
