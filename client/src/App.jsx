import { useState, useRef } from 'react';

export default function App() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!resume || !jobDescription) return;
    setResult('');
    setLoading(true);

    // fetch() with streaming — reads the response body as it arrives
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jobDescription }),
    });

    // ReadableStream lets us read chunks as they arrive
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Append each chunk to the result as it comes in
      setResult(prev => prev + decoder.decode(value));
    }

    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>ResumeAI</h1>
      <p style={{ color: '#666' }}>Paste your resume and a job description to get an AI-powered critique and cover letter.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        <div>
          <label style={{ fontWeight: 500 }}>Your Resume</label>
          <textarea
            value={resume}
            onChange={e => setResume(e.target.value)}
            rows={15}
            placeholder="Paste your resume here..."
            style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={15}
            placeholder="Paste the job description here..."
            style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 13 }}
          />
        </div>
      </div>

      <button
        onClick={analyze}
        disabled={loading || !resume || !jobDescription}
        style={{ marginTop: '1rem', padding: '10px 28px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer' }}
      >
        {loading ? 'Analyzing...' : 'Analyze Resume'}
      </button>

      {result && (
        <div style={{ marginTop: '2rem', background: '#f9f9f9', borderRadius: 8, padding: '1.5rem', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7 }}>
          {result}
        </div>
      )}
    </div>
  );
}