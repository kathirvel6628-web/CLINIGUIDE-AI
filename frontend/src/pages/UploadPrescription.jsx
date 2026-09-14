import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function UploadPrescription({ patientId }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError('');
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.scanPrescription(patientId, file);
      navigate('/confirm', { state: { extraction: result } });
    } catch (err) {
      setError(err.message || 'Could not read the prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24">
      <h1 className="display text-2xl text-brand mb-2">Scan a prescription</h1>
      <p className="text-ink/70 mb-4">Take a clear, well-lit photo of the full prescription.</p>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <img src={preview} alt="Prescription preview" className="mb-4 w-full rounded-card border border-brand/20" />
      ) : (
        <button
          onClick={() => fileInputRef.current.click()}
          className="tap-target mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-brand/40 py-12 text-brand"
        >
          <span className="text-3xl" aria-hidden>📷</span>
          Tap to take a photo or choose a file
        </button>
      )}

      {preview && (
        <button
          onClick={() => fileInputRef.current.click()}
          className="tap-target mb-3 w-full rounded-card border border-brand/40 py-2 text-brand font-medium"
        >
          Retake photo
        </button>
      )}

      {error && <p className="mb-3 text-danger text-sm">{error}</p>}

      <button
        onClick={handleScan}
        disabled={!file || loading}
        className="tap-target w-full rounded-card bg-brand py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Reading prescription…' : 'Scan prescription'}
      </button>

      <p className="mt-3 text-xs text-ink/50">
        You'll be able to review and correct everything before it's saved.
      </p>
    </div>
  );
}
