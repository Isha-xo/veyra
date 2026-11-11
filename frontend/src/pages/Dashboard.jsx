
import { useState } from 'react';

import Navbar from '../components/Navbar';
import AudioRecorder from '../components/AudioRecorder';
import LanguageSelector from '../components/LanguageSelector';
import TranscriptionPanel from '../components/TranscriptionPanel';
import { transcribeAudio } from '../services/api';

function Dashboard() {
  const [language, setLanguage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRecordingComplete = async (audioBlob) => {
    setIsLoading(true);
    setError('');
    setTranscript('');

    try {
      const result = await transcribeAudio(audioBlob, language || null);
      setTranscript(result.transcript);
    } catch (err) {
      setError(err.message || 'Unable to transcribe audio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="eyebrow">WELCOME TO VEYRA</p>
          <h1>
            Bridging voices,
            <br />
            breaking barriers.
          </h1>
          <p>
            Transform spoken language into meaningful text.
            Communicate without boundaries.
          </p>
        </section>

        <section className="workspace">
          <div className="workspace-header">
            <h2>Speech to Text</h2>
            <span>AI Powered Transcription</span>
          </div>

          <div className="recording-area">
            <div className="microphone">🎙️</div>
            <h3>Ready when you are.</h3>
            <p>Start speaking to convert your voice into text.</p>

            <LanguageSelector
              language={language}
              onLanguageChange={setLanguage}
            />

            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
            />

            <TranscriptionPanel
              transcript={transcript}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
