import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export default function AuthGuard() {
  const { token, loadFromStorage } = useAuthStore();

  if (!token) {
    loadFromStorage();
  }

  const currentToken = useAuthStore.getState().token;

  if (!currentToken) {
    return <Navigate to="/bianji/login" replace />;
  }

  return <Outlet />;
}
