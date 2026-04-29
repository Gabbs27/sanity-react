import { Suspense, lazy } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedDashboard from "./components/Dashboard/ProtectedDashboard";

// Lazy load components for better performance
const AllPosts = lazy(() => import("./components/AllPosts"));
const OnePost = lazy(() => import("./components/OnePost"));
const About = lazy(() => import("./components/About"));
const Portfolio = lazy(() => import("./components/Portfolio"));
const Me = lazy(() => import("./components/Me"));
const Repos = lazy(() => import("./components/Repos"));
const NotFound = lazy(() => import("./components/NotFound"));
const Education = lazy(() => import("./components/Education"));
const Services = lazy(() => import("./components/Services"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const DashboardDemo = lazy(() => import("./components/Dashboard/DashboardDemo"));
const AdminLogin = lazy(() => import("./components/Auth/AdminLogin"));
const Valentine = lazy(() => import("./components/Valentine/Valentine"));
const AdminLayout = lazy(() => import("./components/Admin/AdminLayout"));
const PostsList = lazy(() => import("./components/Admin/PostsList"));
const PostEditor = lazy(() => import("./components/Admin/PostEditor"));

/**
 * Wrapper that reads the :id route param and passes it as `key` to PostEditor,
 * so React remounts the component when navigating between different post IDs
 * (or back to /admin/write for a fresh draft). Without this, useEffect's
 * fetch + BlockNote editor state would not reset when switching posts.
 */
function PostEditorWithKey() {
  const { id } = useParams();
  return <PostEditor key={id ?? "new"} />;
}

function App() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
      <Routes>
        <Route element={<Portfolio />} path='/' />
        <Route element={<AllPosts />} path='/allpost' />
        <Route element={<OnePost />} path='/:slug' />
        <Route element={<About />} path='/about' />
        <Route element={<Me />} path='/gabriel-abreu' />
        <Route element={<Repos />} path='/repositorios' />
        <Route element={<Education />} path='/education' />
        <Route element={<Services />} path='/services' />

        {/* Analytics Dashboards (public/demo + login) */}
        <Route element={<DashboardDemo />} path='/dashboard-demo' />
        <Route element={<AdminLogin />} path='/admin-login' />

        {/* Admin routes — all share AdminLayout's sidebar (Dashboard, Posts,
            Write New, Logout). Auth is gated inside AdminLayout via AuthContext. */}
        <Route element={<AdminLayout />}>
          <Route
            path='/dashboard'
            element={
              <ProtectedDashboard>
                <Dashboard />
              </ProtectedDashboard>
            }
          />
          <Route path="/admin/posts" element={<PostsList />} />
          {/* PostEditorWithKey uses the route :id as React `key` so that
              navigating between create (no id) and edit (different ids)
              forces a clean unmount/remount — otherwise local state and
              the BlockNote editor instance leak across routes. */}
          <Route path="/admin/write" element={<PostEditorWithKey />} />
          <Route path="/admin/write/:id" element={<PostEditorWithKey />} />
        </Route>

        {/* Secret Valentine's page */}
        <Route element={<Valentine />} path='/para-ti' />

        {/* Catch-all: must be last */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
export default App;
