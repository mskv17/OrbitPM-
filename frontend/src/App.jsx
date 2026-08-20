import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { AuthPage } from './pages/AuthPage'
import Spinner from './components/Spinner'
import AppLayout from './components/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { AuthMe } from './hooks/AuthMe'
import { EmailVerificationFallBack } from './pages/EmailVerificationFallBack'
import { VerifyEmail } from './pages/VerifyEmail'

function ProtectedRoute({ children }) {
  const { data, isLoading, isError, error } = AuthMe();

  if (isLoading) {
    return <Spinner fullScreen label="Checking your session..." />;
  }

  if (isError && error.success === false) {
    return <Navigate to="/auth" replace />;
  }

  const user = data?.data?.user;

  if (data?.success === false) {
    return <Navigate to="/auth" replace />;
  }

  if (!user?.isVerified) {
    return <EmailVerificationFallBack email={user?.email} />;
  }
  return children;
}

function App() {

  return (
    <AppLayout>
      <Routes>
        <Route path='/dashboard' element={<ProtectedRoute><DashboardPage/></ProtectedRoute>} />
        <Route path='/' element={<Home/>}/>
        <Route path='/auth' element={<AuthPage/>}/>
        <Route path='/verify-email' element={<VerifyEmail/>}/>
        <Route path='*' element={<Navigate to='/' replace />}/>
      </Routes>
    </AppLayout>
  )
}

export default App
