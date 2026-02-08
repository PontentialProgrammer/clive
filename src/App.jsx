import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import LandingPage from './components/landingPage';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route: Everyone can see the landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Route: Only logged-in users can see the dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                {/* Redirect to home if they try to access /dashboard while logged out */}
                <Navigate to="/" replace />
              </SignedOut>
            </>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;