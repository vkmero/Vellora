import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.resetPassword(token.trim(), password, confirmPassword);
      setMessage(data.message || 'Password updated successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Invalid or expired token. Please request a new reset link.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F8EE] border border-[#BDEFE0] text-[11px] text-[#168F79] font-mono font-bold mb-2.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#168F79]" />
          <span>CREDENTIAL ROTATION</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight font-heading">
          Set New Password
        </h2>
        <p className="text-xs text-[#43516A] mt-1 font-sans">
          Provide your verification token and set your new secure password.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {message && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#168F79]" />
          <span>{message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Security Reset Token
          </label>
          <div className="auth-field-group">
            <Key className="auth-icon-leading" />
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste security reset token"
              className="auth-input font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            New Password (min 8 chars)
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

        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1 font-mono">
            Confirm New Password
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-sm font-bold shadow-pastel-md mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Updating Password...</span>
            </>
          ) : (
            <span>Update Password</span>
          )}
        </button>
      </form>

      {/* Back to Login Link */}
      <div className="mt-6 pt-5 border-t border-[#E4E7EF] text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#43516A] hover:text-[#2563A6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
