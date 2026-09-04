import { useNavigate } from 'react-router-dom';
import { clearSession } from '../api/axioApi';

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Employee Management System</h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
