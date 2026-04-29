import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faList, faPenToSquare, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import './AdminLayout.css';

export default function AdminLayout() {
  const { logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null;
  if (!isAuthenticated) {
    navigate('/admin-login', { replace: true });
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">Admin</div>
        <nav className="admin-sidebar__nav" aria-label="Admin navigation">
          <NavLink to="/dashboard" className="admin-nav-link">
            <FontAwesomeIcon icon={faChartLine} /> Dashboard
          </NavLink>
          <NavLink to="/admin/posts" className="admin-nav-link">
            <FontAwesomeIcon icon={faList} /> Posts
          </NavLink>
          <NavLink to="/admin/write" end className="admin-nav-link">
            <FontAwesomeIcon icon={faPenToSquare} /> Write New
          </NavLink>
        </nav>
        <button
          className="admin-sidebar__logout"
          onClick={() => {
            logout();
            navigate('/admin-login', { replace: true });
          }}
          aria-label="Sign out">
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
