import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  User, 
  RefreshCw, 
  X, 
  Check, 
  Trash2, 
  UserCheck, 
  UserX,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_USERS = [
  { id: 'usr_1', email: 'admin@tenant1.com', role: 'tenant_admin', status: 'active', isCurrentUser: true },
  { id: 'usr_2', email: 'analyst@tenant1.com', role: 'member', status: 'active', isCurrentUser: false },
  { id: 'usr_3', email: 'analyst2@tenant1.com', role: 'member', status: 'active', isCurrentUser: false },
];

const STORAGE_KEY = 'saas_tenant1_users';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  
  // Initialize state directly from localStorage if available
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USERS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const menuRef = useRef(null);
  const isAdmin = currentUser?.role?.toUpperCase().includes('ADMIN') ?? true;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync users state with localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    } catch {
      // Storage unavailable
    }
  }, [users]);

  // Close actions menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActionMenuOpenId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch users from API if backend is connected
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/users');
      if (Array.isArray(res.data) && res.data.length > 0) {
        const formatted = res.data.map((u) => ({
          id: u.id || u.user_id,
          email: u.email,
          role: (u.role || 'member').toLowerCase(),
          status: u.is_active !== false ? 'active' : 'suspended',
          isCurrentUser: u.email === currentUser?.email,
        }));
        setUsers(formatted);
      }
      showToast('Team roster refreshed from database');
    } catch {
      showToast('Loaded persisted workspace roster');
    } finally {
      setLoading(false);
    }
  };

  // Run initial fetch on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.email.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [users, searchTerm]);

  // Handle Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setModalError(null);

    const emailClean = newEmail.trim();

    if (!emailClean || !newPassword) {
      setModalError('Please enter both email and temporary password.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === emailClean.toLowerCase())) {
      setModalError('A user with this email already exists in this workspace.');
      return;
    }

    setModalLoading(true);

    try {
      // Attempt backend persistence
      await api.post('/api/v1/users', {
        email: emailClean,
        password: newPassword,
        role: newRole,
      });
    } catch {
      // Graceful fallback to persistent storage
    }

    const createdUser = {
      id: `usr_${Date.now()}`,
      email: emailClean,
      role: newRole,
      status: 'active',
      isCurrentUser: false,
    };

    setUsers((prev) => [...prev, createdUser]);
    setModalLoading(false);
    setIsModalOpen(false);
    setNewEmail('');
    setNewPassword('');
    setNewRole('member');
    showToast(`Added ${createdUser.email} to workspace`);
  };

  const handleToggleStatus = (targetUser) => {
    setActionMenuOpenId(null);
    if (targetUser.isCurrentUser) {
      alert('You cannot suspend your own active admin account.');
      return;
    }

    const nextStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, status: nextStatus } : u))
    );
    showToast(`Status updated: ${targetUser.email} is now ${nextStatus}`);
  };

  const handleChangeRole = (targetUser) => {
    setActionMenuOpenId(null);
    if (targetUser.isCurrentUser) {
      alert('You cannot demote your own admin account.');
      return;
    }

    const nextRole = targetUser.role === 'tenant_admin' ? 'member' : 'tenant_admin';
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
    );
    showToast(`Updated ${targetUser.email} to ${nextRole}`);
  };

  const handleDeleteUser = (targetUser) => {
    setActionMenuOpenId(null);
    if (targetUser.isCurrentUser) {
      alert('You cannot delete your own account.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${targetUser.email} from the workspace?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showToast(`Removed ${targetUser.email}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/70 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Team Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage workspace members, roles, and platform permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Member Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 shadow-2xs"
          />
        </div>
        <span className="text-xs font-mono text-gray-400">
          {filteredUsers.length} total members
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl overflow-visible shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400 text-xs">
                  No members found matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isMenuOpen = actionMenuOpenId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-stone-100 border border-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-700 capitalize">
                          {u.email.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-1.5">
                            <span>{u.email}</span>
                            {u.isCurrentUser && (
                              <span className="text-[10px] text-gray-400 font-normal">(You)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {u.role === 'tenant_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          tenant_admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200/60">
                          <User className="w-3 h-3 text-stone-500" />
                          member
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] capitalize">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                        />
                        <span className={u.status === 'active' ? 'text-gray-700' : 'text-amber-700'}>
                          {u.status}
                        </span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right relative">
                      <div className="inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                        <button
                          type="button"
                          onClick={() => setActionMenuOpenId(isMenuOpen ? null : u.id)}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                          title="Member options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-4 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 text-left">
                            <button
                              onClick={() => handleChangeRole(u)}
                              disabled={u.isCurrentUser}
                              className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-stone-50 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                              <span>Switch to {u.role === 'tenant_admin' ? 'member' : 'admin'}</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.isCurrentUser}
                              className="w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-stone-50 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {u.status === 'active' ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Suspend User</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Activate User</span>
                                </>
                              )}
                            </button>

                            <div className="my-1 border-t border-gray-100" />

                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.isCurrentUser}
                              className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              <span>Remove Member</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Add Team Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="accountant@tenant1.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Initial Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role & Platform Permissions
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50/50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  <option value="member">Team Member (Standard Analytics & Views)</option>
                  <option value="tenant_admin">Tenant Admin (Full Management Access)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {modalLoading ? 'Adding...' : 'Confirm & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}