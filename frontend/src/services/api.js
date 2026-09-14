const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getPatient: (id) => request(`/auth/patients/${id}`),

  scanPrescription: (patientId, file) => {
    const form = new FormData();
    form.append('patient_id', patientId);
    form.append('photo', file);
    return request('/prescriptions/scan', { method: 'POST', body: form });
  },
  confirmPrescription: (prescriptionId, patientId, medicines) =>
    request(`/prescriptions/${prescriptionId}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, medicines }),
    }),
  getMedicines: (patientId) => request(`/prescriptions/patient/${patientId}/medicines`),
  addMedicine: (patientId, data) =>
    request(`/prescriptions/patient/${patientId}/medicines`, { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (medicineId, data) =>
    request(`/prescriptions/medicines/${medicineId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (medicineId) => request(`/prescriptions/medicines/${medicineId}`, { method: 'DELETE' }),

  getTodaySchedule: (patientId) => request(`/reminders/patient/${patientId}/today`),
  confirmDose: (doseLogId) => request(`/reminders/${doseLogId}/confirm`, { method: 'POST' }),
  submitMissedReason: (doseLogId, reason) =>
    request(`/reminders/${doseLogId}/reason`, { method: 'POST', body: JSON.stringify({ reason }) }),

  triggerSOS: (patientId, customMessage) =>
    request(`/sos/patient/${patientId}/trigger`, {
      method: 'POST',
      body: JSON.stringify({ custom_message: customMessage }),
    }),
};
