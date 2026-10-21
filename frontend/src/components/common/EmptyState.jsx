import React from 'react';
import { Database, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = Database,
  title = 'No data available',
  description = 'Get started by creating or uploading your first dataset.',
  actionText = null,
  actionLink = null,
  onAction = null,
}) {
  return (
    <div
      style={{
        background: '#FFFDF8',
        border: '1px solid #E4E7EF',
        boxShadow: '0 2px 8px -1px rgba(23, 37, 84, 0.04)',
      }}
      className="rounded-2xl p-12 text-center flex flex-col items-center justify-center my-6 text-[#18233B]"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#DCEBFF] text-[#2563A6] flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-8 h-8 text-[#2563A6]" />
      </div>

      <h3 className="text-lg font-bold text-[#172554] mb-2 font-heading tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-[#43516A] max-w-md mb-6 leading-relaxed font-sans">{description}</p>

      {actionText && actionLink && (
        <Link to={actionLink} className="btn-primary text-xs py-2 px-4">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{actionText}</span>
        </Link>
      )}

      {actionText && onAction && !actionLink && (
        <button onClick={onAction} className="btn-primary text-xs py-2 px-4">
          <Plus className="w-4 h-4 mr-1.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
