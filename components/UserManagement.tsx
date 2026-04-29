
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldAlert, ShieldCheck, Trash2, Edit2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase, isConfigured } from '../supabase.ts';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
  user_id: string | null;
}

interface UserManagementProps {
  userRole: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ userRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'user' as const });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users_check')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) return;

    setInviting(true);
    try {
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: { role: newUser.role }
      });

      if (error) throw error;

      // Update role in users_check
      if (data.user) {
        await supabase
          .from('users_check')
          .update({ role: newUser.role, is_verified: true })
          .eq('user_id', data.user.id);
      }

      setShowAddModal(false);
      setNewUser({ email: '', password: '', role: 'user' });
      fetchUsers();
      alert('User created successfully!');
    } catch (err: any) {
      alert('Error creating user: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      await supabase
        .from('users_check')
        .update({ role: newRole })
        .eq('id', userId);
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await supabase
        .from('users_check')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      fetchUsers();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await supabase
        .from('users_check')
        .delete()
        .eq('id', userId);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gold/10 text-gold border border-gold/20">
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Manager
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
            User
          </span>
        );
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/40">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20">
            <Users className="text-gold" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white italic uppercase tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-white/40 text-sm">{users.length} utilisateur(s)</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gold text-black font-bold text-[11px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
        >
          <UserPlus size={18} />
          Nouvel Utilisateur
        </button>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-left text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Utilisateur</th>
                <th className="px-6 py-4 text-left text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Rôle</th>
                <th className="px-6 py-4 text-left text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Statut</th>
                <th className="px-6 py-4 text-left text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Dernière Connexion</th>
                <th className="px-6 py-4 text-right text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        {user.role === 'admin' ? (
                          <ShieldAlert size={18} className="text-gold" />
                        ) : (
                          <ShieldCheck size={18} className="text-white/40" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.email}</p>
                        <p className="text-[10px] text-white/30">
                          {user.user_id ? 'Actif' : 'En attente'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                      className="bg-[#0a0d18] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-gold/30"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="user">User</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`flex items-center gap-1.5 text-xs font-bold ${
                        user.is_active ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <CheckCircle size={14} />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-xs text-white/40">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString('fr-FR')
                      : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-white/20 text-sm">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Nouvel Utilisateur</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-[#0a0d18] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-gold/30"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                  Mot de Passe
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-[#0a0d18] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-gold/30"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
                  Rôle
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-[#0a0d18] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-gold/30"
                >
                  <option value="user">Utilisateur</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 text-white/60 font-bold text-[11px] uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 py-3 bg-gold text-black font-bold text-[11px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
