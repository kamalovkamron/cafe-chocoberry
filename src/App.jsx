import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import Prixod from './Prixod';
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/adminpanel" element={<AdminPanel />} />
        <Route path="/prixod" element={<Prixod />} />
      </Routes>
    </Router>
  );
}