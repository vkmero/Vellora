import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import OAuthButtons from '../../components/auth/OAuthButtons';
import ManagerAccessRequestModal from '../../components/auth/ManagerAccessRequestModal';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [intendedRole, setIntendedRole] = useState('analyst'); // 'analyst' | 'manager'
  const [error, setError] = useState(
    location.search.includes('expired=1') ? 'Session expired. Please sign in again.' : ''
  );
  const [loading, setLoading] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [roleNotice, setRoleNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRoleNotice(null);
    setLoading(true);

    try {
      const user = await login(email, password);

      if (intendedRole === 'manager' && user.role === 'analyst') {
        navigate('/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Invalid email or password. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DCEBFF] text-[11px] text-[#2563A6] font-mono font-bold mb-2.5">
          <KeyRound className="w-3.5 h-3.5 text-[#2563A6]" />
          <span>AUTHENTICATED ACCESS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight font-heading">
          Sign In to Vellora
        </h2>
        <p className="text-xs text-[#43516A] mt-1 font-sans">
          Access your intelligent data quality metrics, EDA visualizations, and predictive models.
        </p>
      </div>

      {/* Interface Intention Selector */}
      <div className="mb-5 p-1 rounded-2xl bg-[#F8FAFC] border border-[#E4E7EF] grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setIntendedRole('analyst')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            intendedRole === 'analyst'
              ? 'bg-white text-[#172554] shadow-xs border border-[#DCEBFF]'
              : 'text-[#718096] hover:text-[#172554]'
          }`}
        >
          <UserCheck className={`w-3.5 h-3.5 ${intendedRole === 'analyst' ? 'text-[#2563A6]' : 'text-[#718096]'}`} />
          <span>Analyst Workspace</span>
        </button>

        <button
          type="button"
          onClick={() => setIntendedRole('manager')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            intendedRole === 'manager'
              ? 'bg-white text-[#172554] shadow-xs border border-[#DCEBFF]'
              : 'text-[#718096] hover:text-[#172554]'
          }`}
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${intendedRole === 'manager' ? 'text-[#2563A6]' : 'text-[#718096]'}`} />
          <span>Manager Workspace</span>
        </button>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2.5 animate-fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Role Mismatch Modal Prompt if applicable */}
      {roleNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF8DC] border border-[#FFE7A3] text-[#B7791F] text-xs flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#B7791F]" />
            <span className="font-semibold">{roleNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowManagerModal(true)}
            className="self-start text-[11px] font-bold text-[#172554] hover:underline"
          >
            Apply for Manager Elevation &rarr;
          </button>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider font-mono">
            Professional Email Address
          </label>
          <div className="auth-field-group">
            <Mail className="auth-icon-leading" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@organization.com"
              className="auth-input"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider font-mono">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-[#2563A6] hover:text-[#172554] hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="auth-field-group">
            <Lock className="auth-icon-leading" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="auth-input has-trailing"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-password-toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Primary Submission Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-sm font-bold shadow-pastel-md mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Sign In to {intendedRole === 'manager' ? 'Governance Portal' : 'Workspace'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E4E7EF]" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-mono font-medium">
          <span className="bg-white px-3 text-[#718096]">Or continue with enterprise SSO</span>
        </div>
      </div>

      {/* Social / OAuth SSO Buttons */}
      <OAuthButtons mode="login" />

      {/* Register Prompt */}
      <div className="mt-6 text-center text-xs text-[#43516A]">
        Don't have an enterprise account?{' '}
        <Link
          to="/register"
          className="font-bold text-[#2563A6] hover:text-[#172554] hover:underline transition-colors"
        >
          Register for access
        </Link>
      </div>

      {/* Manager Elevation Modal */}
      <ManagerAccessRequestModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
      />
    </div>
  );
}
