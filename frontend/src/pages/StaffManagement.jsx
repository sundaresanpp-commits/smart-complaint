import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function StaffManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', department: '' });
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/users').then((res) => setUsers(res.data.users)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/admin/users', form);
      setForm({ name: '', email: '', password: '', role: 'staff', department: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleActive = async (id) => {
    await api.put(`/admin/users/${id}/deactivate`);
    load();
  };

  return (
    <Layout>
      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1>Manage Staff & Users</h1>
          <p className="text-slate">Create staff/admin accounts and manage access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Staff/Admin'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24, maxWidth: 500 }}>
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div className="field">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="field">
                <label>Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Infrastructure" />
              </div>
            </div>
            {error && <p className="field-error" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" type="submit">Create Account</button>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-slate">Loading...</p>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--paper)' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <td style={{ padding: '12px 16px' }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                  <td>{u.department || '—'}</td>
                  <td>{u.isActive === false ? 'Inactive' : 'Active'}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(u.id)}>
                      {u.isActive === false ? 'Reactivate' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
