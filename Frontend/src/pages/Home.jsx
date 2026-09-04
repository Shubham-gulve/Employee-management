import { useCallback, useEffect, useState } from 'react';
import axioApi from '../api/axioApi';
import Navbar from '../components/Navbar';
import EmployeeForm from '../components/EmployeeForm';
import EmployeeTable from '../components/EmployeeTable';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Home() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axioApi.get('/employees', { params: { search, page, limit: 10 } });
      setEmployees(res.data.data);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages });
    } catch (err) {
      // A 401 is already handled by the axios interceptor.
      if (err.response?.status !== 401) showMessage('error', 'Could not load employees');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // Re-run on mount and whenever the search box settles.
  useEffect(() => {
    const timer = setTimeout(loadEmployees, 300);
    return () => clearTimeout(timer);
  }, [loadEmployees]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await axioApi.put(`/employees/${editing._id}`, data);
        showMessage('success', 'Employee updated');
      } else {
        await axioApi.post('/employees', data);
        showMessage('success', 'Employee added');
      }
      setEditing(null);
      if (!editing && page !== 1) setPage(1); // a new employee lands on the first page
      else loadEmployees();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Could not save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axioApi.delete(`/employees/${deleting._id}`);
      if (editing?._id === deleting._id) setEditing(null);
      showMessage('success', 'Employee deleted');
      if (employees.length === 1 && page > 1) setPage(page - 1);
      else loadEmployees();
    } catch {
      showMessage('error', 'Could not delete employee');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (employee) => {
    setEditing(employee);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {message && (
          <div
            className={`px-4 py-2 text-sm rounded border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <EmployeeForm
          key={editing?._id || 'new'}
          editing={editing}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <section className="bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-800">
              Employees ({meta.total})
            </h2>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by name or email"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <EmployeeTable
            employees={employees}
            loading={loading}
            onEdit={startEdit}
            onDelete={setDeleting}
          />

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm">
              <span className="text-gray-600">
                Page {page} of {meta.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === meta.totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {deleting && (
        <ConfirmDialog
          message={`Delete ${deleting.name}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
