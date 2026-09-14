import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import Registration from './pages/Registration';
import Dashboard from './pages/Dashboard';
import UploadPrescription from './pages/UploadPrescription';
import ConfirmPrescription from './pages/ConfirmPrescription';
import PrescriptionList from './pages/PrescriptionList';

const STORAGE_KEY = 'cliniguide_patient_id';

export default function App() {
  const [patientId, setPatientId] = useState(() => localStorage.getItem(STORAGE_KEY));

  const handleRegistered = (id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setPatientId(id);
  };

  return (
    <div className="min-h-full">
      <TopBar patientId={patientId} />
      <main>
        <Routes>
          <Route path="/register" element={<Registration onRegistered={handleRegistered} />} />
          <Route
            path="/"
            element={patientId ? <Dashboard patientId={patientId} /> : <Navigate to="/register" replace />}
          />
          <Route path="/upload" element={<UploadPrescription patientId={patientId} />} />
          <Route path="/confirm" element={<ConfirmPrescription patientId={patientId} />} />
          <Route path="/prescriptions" element={<PrescriptionList patientId={patientId} />} />
        </Routes>
      </main>
      {patientId && <BottomNav />}
    </div>
  );
}
