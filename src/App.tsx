import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
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

        {/* Analytics Dashboards */}
        <Route element={<DashboardDemo />} path='/dashboard-demo' />
        <Route element={<AdminLogin />} path='/admin-login' />
        <Route
          path='/dashboard'
          element={
            <ProtectedDashboard>
              <Dashboard />
            </ProtectedDashboard>
          }
        />

        {/* Secret Valentine's page */}
        <Route element={<Valentine />} path='/para-ti' />

        {/* Catch-all: must be last */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
export default App;
