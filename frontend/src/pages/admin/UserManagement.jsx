import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin';
import PageHeader from '../../components/ui/PageHeader';
import VelloraCard from '../../components/ui/VelloraCard';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'requests'
  const [users, setUsers] = useState([]);
  const [managerRequests, setManagerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { request, action }
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers({
        page,
        page_size: 15,
        q: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchManagerRequests = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getManagerRequests({
        page,
        page_size: 15,
        status: statusFilter || undefined,
      });
      setManagerRequests(data.items || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to load manager requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchUsers();
    } else {
      fetchManagerRequests();
    }
  }, [activeTab, page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await adminApi.updateUser(userId, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setUpdatingId(userId);
    try {
      await adminApi.updateUser(userId, { is_active: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await adminApi.reviewManagerRequest(reviewModal.request.id, {
        status: reviewModal.action,
        admin_notes: adminNotes.trim() || null,
      });
      setReviewModal(null);
      setAdminNotes('');
      fetchManagerRequests();
    } catch (err) {
      alert('Error reviewing request: ' + (err.response?.data?.message || err.message));
    } finally {
      setReviewLoading(false);
    }
  };

  const pendingRequestsCount = managerRequests.filter((r) => r.status === 'pending').length;

  return (
    <div data-page-theme="admin" className="space-y-6 animate-fade-in theme-admin">
      {/* Page Header */}
      <PageHeader
        title="Identity & Access Governance"
        subtitle="Provision enterprise user roles, manage authentication credentials, and authorize Manager access requests."
        breadcrumbs={[{ label: 'System', to: '/admin' }, { label: 'User & Access Directory' }]}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]">
            ● Enterprise Directory Active
          </span>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#E4E7EF]">
        <button
          onClick={() => {
            setActiveTab('directory');
            setPage(1);
          }}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'directory'
              ? 'border-[#B7791F] text-[#B7791F]'
              : 'border-transparent text-[#718096] hover:text-[#172554]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts Directory</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('requests');
            setPage(1);
          }}
          className={`py-3 px-5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-[#B7791F] text-[#B7791F]'
              : 'border-transparent text-[#718096] hover:text-[#172554]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#168F79]" />
          <span>Manager Access Applications</span>
          {pendingRequestsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3] text-[10px] font-bold">
              {pendingRequestsCount} pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: USER DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-[#E4E7EF] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#718096] absolute left-3 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] placeholder-[#718096] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all"
              />
            </form>

            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-[#718096]" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all w-44 font-semibold"
              >
                <option value="">All Roles</option>
                <option value="analyst">Analyst</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users found"
              description="Adjust your search query or role filter."
            />
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden p-0 border border-[#E4E7EF] shadow-sm">
              <div className="overflow-x-auto">
                <table className="vellora-table">
                  <thead>
                    <tr>
                      <th>User Identity</th>
                      <th>Assigned Role</th>
                      <th>Account State</th>
                      <th>Registered</th>
                      <th>Last Authentication</th>
                      <th className="text-right">Privilege Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#FFF8DC] border border-[#FFE7A3] flex items-center justify-center text-[#B7791F] font-bold text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-[#172554] block text-sm">{u.name}</span>
                              <span className="text-xs text-[#718096]">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={updatingId === u.id}
                            className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-[#FFFDF8] border border-[#E4E7EF] text-[#18233B] focus:outline-none"
                          >
                            <option value="analyst">Analyst</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              u.is_active
                                ? 'bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]'
                                : 'bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]'
                            }`}
                          >
                            {u.is_active ? '● Active' : '● Disabled'}
                          </span>
                        </td>
                        <td className="text-xs text-[#718096] whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-xs text-[#718096] whitespace-nowrap">
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleStatusToggle(u.id, u.is_active)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              u.is_active
                                ? 'bg-[#FFF0E6] text-[#D87563] border-[#FFD8C5] hover:bg-[#FFD8C5]'
                                : 'bg-[#E3F8EE] text-[#168F79] border-[#BDEFE0] hover:bg-[#BDEFE0]'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-[#E4E7EF] flex items-center justify-between text-xs text-[#718096]">
                  <span>Page {page} of {totalPages}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] cursor-pointer disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-[#FFFDF8] hover:bg-[#FFF9F0] border border-[#E4E7EF] text-[#172554] cursor-pointer disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: MANAGER ACCESS REQUESTS */}
      {activeTab === 'requests' && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-[#E4E7EF] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#172554]">Status Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-[#E4E7EF] bg-[#FFFDF8] text-[#18233B] focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3] focus:outline-none transition-all w-44"
              >
                <option value="">All Applications</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="changes_requested">Changes Requested</option>
              </select>
            </div>
            <span className="text-xs text-[#718096]">
              Enforces server-side authorization & anti-self-approval checks
            </span>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : managerRequests.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No Manager Access Applications"
              description="No applications found matching the selected status filter."
            />
          ) : (
            <div className="bg-white rounded-3xl overflow-hidden p-0 border border-[#E4E7EF] shadow-sm">
              <div className="overflow-x-auto">
                <table className="vellora-table">
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Organization / Team</th>
                      <th>Business Justification</th>
                      <th>Submission Date</th>
                      <th>Review Status</th>
                      <th className="text-right">Decision Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerRequests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div>
                            <span className="font-semibold text-[#172554] block text-sm">{req.user_name}</span>
                            <span className="text-xs text-[#718096]">{req.user_email}</span>
                          </div>
                        </td>
                        <td className="text-xs text-[#18233B]">
                          {req.organization_or_team || '—'}
                        </td>
                        <td className="text-xs text-[#718096] max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="text-xs text-[#718096] whitespace-nowrap">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              req.status === 'approved'
                                ? 'bg-[#E3F8EE] text-[#168F79] border border-[#BDEFE0]'
                                : req.status === 'pending'
                                ? 'bg-[#FFF8DC] text-[#B7791F] border border-[#FFE7A3]'
                                : 'bg-[#FFF0E6] text-[#D87563] border border-[#FFD8C5]'
                            }`}
                          >
                            ● {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-right whitespace-nowrap">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setReviewModal({ request: req, action: 'approved' })}
                                className="px-3 py-1.5 rounded-xl bg-[#168F79] hover:bg-[#127260] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setReviewModal({ request: req, action: 'rejected' })}
                                className="px-3 py-1.5 rounded-xl bg-[#FFF0E6] hover:bg-[#FFD8C5] text-[#D87563] border border-[#FFD8C5] text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5 text-[#D87563]" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="text-[11px] text-[#718096]">
                              <span>By {req.reviewer_name || 'Admin'}</span>
                              {req.admin_notes && (
                                <p className="text-[10px] text-[#172554] truncate max-w-[12rem]">{req.admin_notes}</p>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Decision Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E4E7EF] text-[#18233B]">
            <h3 className="text-base font-bold text-[#172554] mb-1">
              Confirm Decision: {reviewModal.action.toUpperCase()}
            </h3>
            <p className="text-xs text-[#718096] mb-4">
              Applicant: <strong className="text-[#172554]">{reviewModal.request.user_name}</strong> ({reviewModal.request.user_email})
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-[#172554] uppercase tracking-wider mb-1">
                Admin Audit Notes / Feedback (Optional)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add optional rationale for the decision..."
                className="w-full rounded-xl border border-[#E4E7EF] bg-[#FFFDF8] p-2.5 text-xs text-[#18233B] placeholder-[#718096] focus:outline-none focus:border-[#E9B949] focus:ring-2 focus:ring-[#FFE7A3]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="py-1.5 px-4 rounded-xl text-xs font-semibold text-[#718096] hover:bg-[#FFF9F0] border border-[#E4E7EF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={reviewLoading}
                className={`py-2 px-5 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  reviewModal.action === 'approved'
                    ? 'bg-[#168F79] hover:bg-[#127260]'
                    : 'bg-[#D87563] hover:bg-[#C25845]'
                }`}
              >
                {reviewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span>Confirm {reviewModal.action === 'approved' ? 'Approval' : 'Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
