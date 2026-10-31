import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Translator } from './pages/Translator';
import { ReverseCommunication } from './pages/ReverseCommunication';
import { Vocabulary } from './pages/Vocabulary';
import { History } from './pages/History';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/translator" element={<Translator />} />
              <Route path="/reverse" element={<ReverseCommunication />} />
              <Route path="/vocabulary" element={<Vocabulary />} />
              <Route path="/history" element={<History />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
