import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import HomePage from './pages/HomePage.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import TermsOfService from './pages/TermsOfService.tsx';
import CookiePolicy from './pages/CookiePolicy.tsx';
import { CookieProvider } from './contexts/CookieContext';
import MetaPixel from './components/MetaPixel';

function App() {
  return (
    <CookieProvider>
      <Router>
        <MetaPixel />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
          </Routes>
        </Layout>
      </Router>
    </CookieProvider>
  );
}

export default App;