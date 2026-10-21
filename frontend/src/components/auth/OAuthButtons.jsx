import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { Loader2, Info, X } from 'lucide-react';

export default function OAuthButtons({ mode = 'login' }) {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [configNotice, setConfigNotice] = useState(null);

  const handleOAuthClick = async (provider) => {
    setLoadingProvider(provider);
    setConfigNotice(null);
    try {
      const data = await authApi.getOAuthUrl(provider);
      if (data && data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        `${provider.toUpperCase()}_CLIENT_ID & ${provider.toUpperCase()}_CLIENT_SECRET not configured in backend/.env.`;
      setConfigNotice({
        provider: provider.charAt(0).toUpperCase() + provider.slice(1),
        message: msg,
      });
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Notice modal/banner if provider credentials missing */}
      {configNotice && (
        <div className="p-3.5 rounded-2xl bg-[#EFF6FF] text-[#172554] text-xs border border-[#DCEBFF] shadow-xs animate-fade-in relative">
          <button
            onClick={() => setConfigNotice(null)}
            className="absolute top-2.5 right-2.5 text-[#718096] hover:text-[#172554] transition-colors p-1"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-2.5 pr-6">
            <Info className="w-4 h-4 text-[#2563A6] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#172554]">
                {configNotice.provider} OAuth Integration
              </p>
              <p className="text-[11px] text-[#43516A] mt-0.5 leading-relaxed">
                {configNotice.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3 Aligned OAuth Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuthClick('google')}
          disabled={loadingProvider !== null}
          className="btn-oauth"
          aria-label={`Continue with Google for ${mode}`}
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#172554]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span className="truncate">Google</span>
        </button>

        {/* GitHub */}
        <button
          type="button"
          onClick={() => handleOAuthClick('github')}
          disabled={loadingProvider !== null}
          className="btn-oauth"
          aria-label={`Continue with GitHub for ${mode}`}
        >
          {loadingProvider === 'github' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#172554]" />
          ) : (
            <svg className="w-4 h-4" fill="#172554" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          )}
          <span className="truncate">GitHub</span>
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={() => handleOAuthClick('linkedin')}
          disabled={loadingProvider !== null}
          className="btn-oauth"
          aria-label={`Continue with LinkedIn for ${mode}`}
        >
          {loadingProvider === 'linkedin' ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#172554]" />
          ) : (
            <svg className="w-4 h-4" fill="#0A66C2" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
          )}
          <span className="truncate">LinkedIn</span>
        </button>
      </div>
    </div>
  );
}
