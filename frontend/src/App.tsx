import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Layout, RequireRole } from './components/Layout';
import { AuthPage } from './pages/Auth';
import { ApplicantsPage, CompanyJobsPage, CreateJobPage } from './pages/Company';
import { JobDetailPage, JobListPage, MyApplicationsPage } from './pages/Seeker';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'COMPANY' ? '/company/jobs' : '/jobs'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<Layout />}>
        <Route element={<RequireRole role="JOB_SEEKER" />}>
          <Route path="/jobs" element={<JobListPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/applications" element={<MyApplicationsPage />} />
        </Route>
        <Route element={<RequireRole role="COMPANY" />}>
          <Route path="/company/jobs" element={<CompanyJobsPage />} />
          <Route path="/company/jobs/new" element={<CreateJobPage />} />
          <Route path="/company/jobs/:id/applicants" element={<ApplicantsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
