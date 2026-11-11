
function TranscriptionPanel({ transcript, isLoading, error }) {
  return (
    <div className="transcription-panel">
      <h3>Transcription</h3>

      {isLoading && <p>Transcribing your audio...</p>}

      {error && <p role="alert">{error}</p>}

      {!isLoading && !error && transcript && (
        <p>{transcript}</p>
      )}

      {!isLoading && !error && !transcript && (
        <p>Your transcription will appear here.</p>
      )}
    </div>
  );
}

export default TranscriptionPanel;
