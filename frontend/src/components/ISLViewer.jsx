import React from 'react';

function ISLViewer({ nlpData, isLoading }) {
  if (isLoading) {
    return (
      <div className="isl-viewer loading">
        <p>🧠 Processing Indian Sign Language (SOV grammar & sign tokens)...</p>
      </div>
    );
  }

  if (!nlpData) {
    return null;
  }

  const original_text = nlpData.original_text || "";
  const isl_grammar_text = nlpData.isl_grammar_text || "";
  const animation_sequence = Array.isArray(nlpData.animation_sequence) ? nlpData.animation_sequence : [];
  const intent = nlpData.intent || null;

  return (
    <div className="isl-viewer">
      <div className="isl-header">
        <span className="isl-badge">PHASE 2 • ISL TRANSLATION</span>
        <h3>Sign Language Sequence</h3>
      </div>

      {/* ISL Grammar Reordered Sentence */}
      <div className="isl-sentence-box">
        <span className="isl-label">ISL Grammar (SOV Order):</span>
        <div className="isl-grammar-text">{isl_grammar_text}</div>
      </div>

      {/* Intent & Entity Slots */}
      {intent && (
        <div className="isl-meta-bar">
          <div className="intent-tag">
            <strong>Intent:</strong> {intent.intent} ({Math.round(intent.confidence * 100)}%)
          </div>
          {intent.slots && Object.keys(intent.slots).length > 0 && (
            <div className="slots-container">
              {Object.entries(intent.slots).map(([key, val]) => (
                <span key={key} className="slot-badge">
                  {key}: <em>{val}</em>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Animation Sequence Tokens */}
      <div className="isl-tokens-section">
        <span className="isl-label">Animation Queue ({animation_sequence.length} signs):</span>
        <div className="isl-tokens-grid">
          {animation_sequence.map((item, idx) => (
            <div
              key={idx}
              className={`isl-token-card ${item.type === 'fingerspell' ? 'token-spell' : 'token-word'}`}
            >
              <span className="token-index">#{idx + 1}</span>
              <div className="token-name">{item.token}</div>
              <span className="token-asset">🎬 {item.asset}</span>
              <span className="token-type">{item.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ISLViewer;
