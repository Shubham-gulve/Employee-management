import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axioApi from '../api/axioApi';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // The API also checks this, but catching it here saves a round trip.
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await axioApi.post('/auth/register', form);
      setSuccess('Account created. Taking you to the login page...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg p-6">
        <h1 className="text-xl font-semibold text-gray-800">Create account</h1>
        <p className="mt-1 text-sm text-gray-600">Employee Management System</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-700 mb-1">Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} required className={inputClass} />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="username"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
          </div>

          {error && (
            <p className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</p>
          )}
          {success && (
            <p className="px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
