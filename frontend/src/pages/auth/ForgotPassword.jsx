import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const data = await authApi.forgotPassword(email.trim());
      setMessage(data.message || 'If an account exists for that email, recovery instructions have been prepared.');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Heading */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DCEBFF] text-[11px] text-[#2563A6] font-mono font-bold mb-2.5">
          <KeyRound className="w-3.5 h-3.5 text-[#2563A6]" />
          <span>ACCOUNT RECOVERY</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172554] tracking-tight font-heading">
          Reset Your Password
        </h2>
        <p className="text-xs text-[#43516A] mt-1 font-sans">
          Enter your registered work email to receive password reset authorization.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#FFF0E6] border border-[#FFD8C5] text-[#D87563] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#D87563]" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-4 p-3.5 rounded-2xl bg-[#E3F8EE] border border-[#BDEFE0] text-[#168F79] text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#168F79]" />
          <span>{message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1.5 font-mono">
            Work Email Address
          </label>
          <div className="auth-field-group">
            <Mail className="auth-icon-leading" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@vellora.io"
              className="auth-input"
              autoComplete="email"
            />
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
              <span>Generating Secure Link...</span>
            </>
          ) : (
            <span>Send Reset Instructions</span>
          )}
        </button>
      </form>

      {/* Return to Sign In Link */}
      <div className="mt-6 pt-5 border-t border-[#E4E7EF] text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#43516A] hover:text-[#2563A6] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
