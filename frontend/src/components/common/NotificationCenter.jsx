import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import {
  Bell,
  Check,
  CheckCheck,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Database,
  Sparkles,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.list(1, 30);
      setNotifications(data.items || []);
      setUnreadCount(data.unread || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleItemClick = (n) => {
    if (!n.is_read) {
      notificationsApi.markRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsOpen(false);

    // Entity navigation based on type
    const type = n.notification_type || '';
    if (type.includes('approval')) {
      navigate('/manager/approvals');
    } else if (type.includes('report')) {
      navigate('/reports');
    } else if (type.includes('quality') || type.includes('dataset')) {
      navigate('/datasets');
    } else if (type.includes('prediction')) {
      navigate('/predictions');
    } else {
      navigate('/dashboard');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'approval_requested':
        return <ShieldAlert className="w-4 h-4 text-[#B7791F]" />;
      case 'approved':
        return <ShieldCheck className="w-4 h-4 text-[#168F79]" />;
      case 'rejected':
      case 'changes_requested':
        return <AlertTriangle className="w-4 h-4 text-[#D87563]" />;
      case 'report_generated':
        return <FileText className="w-4 h-4 text-[#2563A6]" />;
      case 'prediction_completed':
        return <Sparkles className="w-4 h-4 text-[#7665B5]" />;
      default:
        return <Database className="w-4 h-4 text-[#718096]" />;
    }
  };

  const filteredItems = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5 transition-colors border border-[#E4E7EF]"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-bold text-white font-mono shadow-xs bg-[#2563A6]"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E4E7EF] shadow-pastel-lg z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-[#E4E7EF] flex items-center justify-between bg-[#FFFDF8]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#172554] text-sm font-heading">Notifications</span>
              {unreadCount > 0 && (
                <span className="badge badge-info text-[10px] font-mono">{unreadCount} unread</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-medium flex items-center gap-1 text-[#2563A6] transition-colors hover:underline"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-[#718096] hover:text-[#172554] hover:bg-[#172554]/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex border-b border-[#E4E7EF] px-4 py-2 gap-2 bg-[#FFF9F0] text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-[#172554] font-bold shadow-xs border border-[#E4E7EF]'
                  : 'text-[#43516A] hover:text-[#172554]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-white text-[#2563A6] font-bold shadow-xs border border-[#DCEBFF]'
                  : 'text-[#43516A] hover:text-[#172554]'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F0F2F7]">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-[#718096] text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563A6]" />
                <span>Loading notifications...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-8 text-center text-[#718096] text-xs">
                <Bell className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2 opacity-50" />
                <p>No {filter === 'unread' ? 'unread ' : ''}notifications.</p>
              </div>
            ) : (
              filteredItems.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 hover:bg-[#FFF9F0] transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.is_read ? 'bg-[#EFF6FF]' : 'bg-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#FFFDF8] border border-[#E4E7EF] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.notification_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-[#172554] font-bold' : 'text-[#43516A]'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <button
                          onClick={(e) => handleMarkRead(e, n.id)}
                          className="text-[#718096] hover:text-[#2563A6] p-0.5 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#43516A] mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-[#718096] font-mono mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull;{' '}
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
