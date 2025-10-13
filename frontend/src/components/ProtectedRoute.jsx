//frontend/src/components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {AuthContext} from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    alert('Please login or signup before.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
