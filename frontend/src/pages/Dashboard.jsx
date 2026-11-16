import { useState } from 'react';

import Navbar from '../components/Navbar';
import AudioRecorder from '../components/AudioRecorder';
import LanguageSelector from '../components/LanguageSelector';
import TranscriptionPanel from '../components/TranscriptionPanel';
import ISLViewer from '../components/ISLViewer';
import SignPlayer from '../components/SignPlayer';
import { transcribeAudio, processTextToISL } from '../services/api';

const QUICK_SAMPLES = [
  "The admissions office is on the first floor.",
  "Please bring your ID card.",
  "Where is the library?",
  "Kripya apna pehchan patra laaiye."
];

function Dashboard() {
  const [language, setLanguage] = useState('');
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [nlpData, setNlpData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNlpLoading, setIsNlpLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Voice Recording Flow -> Transcribe -> Auto Run NLP
  const handleRecordingComplete = async (audioBlob) => {
    setIsLoading(true);
    setIsNlpLoading(true);
    setError('');
    setTranscript('');
    setNlpData(null);

    try {
      const result = await transcribeAudio(audioBlob, language || null);
      setTranscript(result.transcript);

      // Run NLP on the transcribed text
      if (result.transcript) {
        const islResult = await processTextToISL(result.transcript);
        setNlpData(islResult);
      }
    } catch (err) {
      setError(err.message || 'Unable to process audio.');
    } finally {
      setIsLoading(false);
      setIsNlpLoading(false);
    }
  };

  // 2. Manual Text Input Flow -> Run NLP directly
  const handleManualSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!manualText.trim()) return;

    setIsNlpLoading(true);
    setError('');
    setTranscript(manualText);

    try {
      const islResult = await processTextToISL(manualText);
      setNlpData(islResult);
    } catch (err) {
      setError(err.message || 'NLP translation failed.');
    } finally {
      setIsNlpLoading(false);
    }
  };

  const handleSelectSample = (sample) => {
    setManualText(sample);
  };

  return (
    <div className="dashboard">
      <Navbar />

      <main className="dashboard-content">
        <section className="welcome-section">
          <p className="eyebrow">WELCOME TO VEYRA (SIGNBRIDGE)</p>
          <h1>
            Bridging voices,
            <br />
            breaking barriers.
          </h1>
          <p>
            Transform spoken language and text into structured Indian Sign Language (ISL).
          </p>
        </section>

        {/* WORKSPACE */}
        <section className="workspace">
          <div className="workspace-header">
            <div>
              <h2>Speech & Text to Sign Language</h2>
              <span>ASR (Speech-to-Text) + NLP (ISL Grammar Conversion)</span>
            </div>
          </div>

          {/* SECTION 1: Voice Recording Input */}
          <div className="recording-area">
            <div className="microphone">🎙️</div>
            <h3>Test via Microphone Speech</h3>
            <p>Speak clearly in English, Hindi, or Hinglish.</p>

            <LanguageSelector
              language={language}
              onLanguageChange={setLanguage}
            />

            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
            />
          </div>

          {/* SECTION 2: Manual Text Input Tester */}
          <div className="manual-input-section">
            <div className="divider-label">
              <span>OR TEST DIRECT TEXT INPUT</span>
            </div>

            <form onSubmit={handleManualSubmit} className="manual-input-form">
              <input
                type="text"
                placeholder="Type a sentence to translate to Sign Language..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="text-input-field"
              />
              <button
                type="submit"
                disabled={isNlpLoading || !manualText.trim()}
                className="submit-btn"
              >
                {isNlpLoading ? "Converting..." : "Translate to ISL ➔"}
              </button>
            </form>

            <div className="quick-samples">
              <span className="samples-label">Quick Test Sentences:</span>
              <div className="samples-pills">
                {QUICK_SAMPLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-pill"
                    onClick={() => {
                      setManualText(sample);
                    }}
                  >
                    "{sample}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: Transcription Output */}
          <TranscriptionPanel
            transcript={transcript}
            isLoading={isLoading}
            error={error}
          />

          {/* SECTION 4: Interactive Sign Language Video Player */}
          {nlpData && nlpData.animation_sequence && (
            <SignPlayer
              animationSequence={nlpData.animation_sequence}
            />
          )}

          {/* SECTION 5: Indian Sign Language (ISL) Sequence & Metadata */}
          <ISLViewer
            nlpData={nlpData}
            isLoading={isNlpLoading}
          />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
