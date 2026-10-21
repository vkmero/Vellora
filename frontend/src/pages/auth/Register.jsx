import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import OAuthButtons from '../../components/auth/OAuthButtons';
import ManagerAccessRequestModal from '../../components/auth/ManagerAccessRequestModal';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirmation.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });
      setSuccess('Profile initialized successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Registration failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Title */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DCEBFF] text-[11px] text-[#2563A6] font-mono font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#2563A6]" />
          <span>JOIN DATA WORKSPACE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight font-heading">
          Register as Analyst
        </h2>
        <p className="text-xs text-[#43516A] mt-1 font-sans">
          Access automated profiling, dimensional quality checks, and prescriptive ML models.
        </p>
      </div>

      {/* Role Policy Reminder Badge */}
      <div className="mb-4 p-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E4E7EF] text-[11px] text-[#43516A] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#168F79]" />
          <span>Standard accounts provision as <strong className="text-[#172554]">Analyst</strong>.</span>
        </span>
        <button
          type="button"
          onClick={() => setShowManagerModal(true)}
          className="text-[#2563A6] font-semibold hover:underline"
        >
          Need Manager?
        </button>
      </div>

      {/* Error & Success Alerts */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#168F79]" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Full Name
          </label>
          <div className="auth-field-group">
            <User className="auth-icon-leading" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dr. Elena Vance"
              className="auth-input"
              autoComplete="name"
            />
          </div>
        </div>

        {/* Work Email */}
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Work Email Address
          </label>
          <div className="auth-field-group">
            <Mail className="auth-icon-leading" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="elena.vance@enterprise.io"
              className="auth-input"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Password (min. 8 characters)
          </label>
          <div className="auth-field-group">
            <Lock className="auth-icon-leading" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="auth-input has-trailing"
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Confirm Password
          </label>
          <div className="auth-field-group">
            <Lock className="auth-icon-leading" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="auth-input has-trailing"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="auth-password-toggle"
              aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-sm font-bold shadow-pastel-md mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Registering Profile...</span>
            </>
          ) : (
            <>
              <span>Initialize Analyst Account</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </form>

      {/* Social Identity OAuth Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px bg-[#E4E7EF] flex-1" />
        <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider font-mono">
          Or Register With
        </span>
        <div className="h-px bg-[#E4E7EF] flex-1" />
      </div>

      {/* OAuth Buttons */}
      <OAuthButtons mode="register" />

      {/* Link to Login */}
      <div className="mt-5 pt-4 border-t border-[#E4E7EF] text-center">
        <p className="text-xs text-[#43516A]">
          Already provisioned with an account?{' '}
          <Link
            to="/login"
            className="font-bold text-[#2563A6] hover:text-[#172554] hover:underline transition-colors"
          >
            Sign In Instead
          </Link>
        </p>
      </div>

      {/* Manager Access Request Modal */}
      <ManagerAccessRequestModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
      />
    </div>
  );
}
