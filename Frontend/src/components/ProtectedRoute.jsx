import { Navigate } from 'react-router-dom';
import { getToken } from '../api/axioApi';

// Keeps the employee pages behind a successful login.
// The API checks the same token, this only avoids rendering a dead screen.
export default function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}
