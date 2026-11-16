import React, { useState, useEffect, useRef } from 'react';
import Avatar3D from './Avatar3D';

// Gestural cues / descriptions for Indian Sign Language vocabulary
const GESTURE_DESCRIPTIONS = {
  PLEASE: "Open right palm flat against chest, circular movement clockwise.",
  THANK_YOU: "Fingertips of flat hand touch chin, then move forward toward person.",
  HELLO: "Open hand near forehead in a respectful outward waving salute.",
  WELCOME: "Open hands facing upward, drawing inward toward body.",
  ID_CARD: "Draw rectangular card outline with index fingers, place against chest.",
  ADMISSION: "Flat hand slides upward into open palm, indicating entry.",
  OFFICE: "Two hands form right angles indicating walls/room boundaries.",
  FIRST: "Index finger pointed upward firmly.",
  SECOND: "Two fingers (index + middle) held up in 'V' formation.",
  THIRD: "Three fingers held up.",
  FLOOR: "Flat palms facing downward, moving horizontally.",
  LIBRARY: "Hand turns pages of an open palm book.",
  BRING: "Both palms facing upward, moving toward body.",
  SUBMIT: "Both hands holding flat document forward onto desk.",
  PAY: "Fingertips rub thumb simulating money exchange.",
  WHERE: "Both open hands facing upward, shrugging side-to-side.",
  WHAT: "Index finger wagging side-to-side with questioning facial expression.",
  HOW: "Both hands start palms-down at chest, rolling outward to finish palms-up toward sky.",
  WHEN: "Right index finger circles around upright left index finger like clock hands.",
  WHO: "Dominant index finger circling inquiringly near chin.",
  WHICH: "Both hands thumbs-up alternating up and down weighing choices.",
  WHY: "Dominant hand near temple pulling outward while wagging fingers inquiringly.",
  YES: "Clenched fist nodding up and down.",
  NO: "Index, middle finger, and thumb snapping closed.",
  SORRY: "Right fist rubbing gently in a circle on chest.",
  OK: "Thumb and index finger form circle with three fingers extended upward.",
  GOOD: "Crisp thumbs-up hand moving affirmatively upward.",
  NAME: "Index and middle fingers tapping forward.",
  UNDERSTAND: "Index finger near temple flicking open with insight.",
};

function SignPlayer({ animationSequence }) {
  const [playerMode, setPlayerMode] = useState('avatar'); // 'avatar' (3D) or 'video'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const videoRef = useRef(null);

  // Allow pressing Escape to close Theater Mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTheaterMode) {
        setIsTheaterMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode]);

  const totalSigns = animationSequence && Array.isArray(animationSequence) ? animationSequence.length : 0;
  
  // Guard index to prevent out-of-bounds crash
  const safeIndex = totalSigns > 0 ? Math.min(Math.max(0, currentIndex), totalSigns - 1) : 0;
  const activeSign = totalSigns > 0 ? animationSequence[safeIndex] : null;

  // Reset when a new sequence arrives
  useEffect(() => {
    setCurrentIndex(0);
    setVideoError(false);
    setProgress(0);
    setIsCompleted(false);
    if (totalSigns > 0) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [animationSequence, totalSigns]);

  // Adjust video playback speed if in video mode
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, safeIndex]);

  // Safe timer for Avatar Mode (and Video Fallback) Auto-Advance
  useEffect(() => {
    const shouldRunTimer =
      isPlaying &&
      activeSign &&
      !isCompleted &&
      (playerMode === 'avatar' || (playerMode === 'video' && videoError));

    if (!shouldRunTimer) return;

    const duration = 2000 / playbackSpeed;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setProgress(100);

        if (safeIndex < totalSigns - 1) {
          setVideoError(false);
          setProgress(0);
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Reached the end of the sentence
          setIsPlaying(false);
          setIsCompleted(true);
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, safeIndex, playerMode, videoError, playbackSpeed, totalSigns, isCompleted]);

  // Video ended event
  const handleVideoEnded = () => {
    if (safeIndex < totalSigns - 1) {
      setVideoError(false);
      setProgress(0);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      setIsCompleted(true);
    }
  };

  const handleNext = () => {
    if (safeIndex < totalSigns - 1) {
      setVideoError(false);
      setProgress(0);
      setIsCompleted(false);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (safeIndex > 0) {
      setVideoError(false);
      setProgress(0);
      setIsCompleted(false);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReplay = () => {
    setVideoError(false);
    setProgress(0);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsPlaying(true);
    if (videoRef.current && playerMode === 'video') {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlayPause = () => {
    if (isCompleted) {
      handleReplay();
      return;
    }
    if (playerMode === 'video' && videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  if (!animationSequence || totalSigns === 0 || !activeSign) {
    return null;
  }

  const tokenName = activeSign.token || "UNKNOWN";
  const isSpell = activeSign.type === 'fingerspell' || tokenName.startsWith('_SPELL_');
  const spellLetter = isSpell ? tokenName.replace('_SPELL_', '') : null;
  const displayToken = spellLetter ? `Letter '${spellLetter}'` : tokenName;

  const gestureDesc =
    GESTURE_DESCRIPTIONS[tokenName] ||
    (isSpell
      ? `Fingerspell letter '${spellLetter}' using standard ISL alphabet.`
      : `Perform sign for '${tokenName}'.`);

  return (
    <div className={`sign-player-container ${isTheaterMode ? 'theater-mode' : ''}`}>
      {/* Player Header */}
      <div className="player-header">
        <div className="player-title-box">
          <span className="live-pill">
            <span className="live-dot"></span> ISL ANIMATION STAGE
          </span>
          <h4>
            Sign {safeIndex + 1} of {totalSigns}: <strong>{displayToken}</strong>
          </h4>
        </div>

        {/* View Mode Switcher + Theater + Speed Controls */}
        <div className="player-header-controls">
          <div className="mode-switch-group">
            <button
              type="button"
              className={`mode-btn ${playerMode === 'avatar' ? 'active' : ''}`}
              onClick={() => setPlayerMode('avatar')}
              title="3D Animated Sign Avatar"
            >
              🤖 3D Avatar
            </button>
            <button
              type="button"
              className={`mode-btn ${playerMode === 'video' ? 'active' : ''}`}
              onClick={() => setPlayerMode('video')}
              title="Real Sign Video Clips (.mp4)"
            >
              🎬 Video Clips
            </button>
            <button
              type="button"
              className={`mode-btn theater-toggle-btn ${isTheaterMode ? 'active' : ''}`}
              onClick={() => setIsTheaterMode((prev) => !prev)}
              title={isTheaterMode ? "Exit Fullscreen Theater (Esc)" : "Expand Stage to Fit Entire Screen"}
            >
              {isTheaterMode ? "🗗 Exit Fit" : "⛶ Fit Screen"}
            </button>
          </div>

          <div className="speed-selector">
            <span className="speed-label">Speed:</span>
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                type="button"
                className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main 3D / Video Stage */}
      <div className="player-stage">
        {isCompleted ? (
          /* Sequence Complete Card */
          <div className="avatar-simulator-stage completed-stage">
            <div className="gesture-icon-avatar">🎉</div>
            <div className="simulator-token-title">SENTENCE COMPLETED</div>
            <div className="simulator-gesture-desc">
              All {totalSigns} signs have finished playing. Click Replay or select any sign below to watch again.
            </div>
            <button type="button" className="ctrl-btn main-play-btn replay-finish-btn" onClick={handleReplay}>
              🔄 Replay Sentence
            </button>
          </div>
        ) : playerMode === 'avatar' ? (
          /* 1. 3D WebGL Avatar Engine */
          <div className="stage-3d-wrapper">
            <Avatar3D
              activeToken={tokenName}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              isTheaterMode={isTheaterMode}
              onToggleTheater={() => setIsTheaterMode((prev) => !prev)}
            />
            {isPlaying && (
              <div className="sim-progress-bar">
                <div
                  className="sim-progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : !videoError ? (
          /* 2. Real MP4 Video Player */
          <video
            ref={videoRef}
            key={activeSign.asset || tokenName}
            src={`/signs/${activeSign.asset || `${tokenName}.mp4`}`}
            autoPlay={isPlaying}
            playsInline
            muted
            className="sign-video-element"
            onEnded={handleVideoEnded}
            onError={() => {
              setVideoError(true);
            }}
          />
        ) : (
          /* 3. Video Not Found Helper */
          <div className="avatar-simulator-stage">
            <div className="gesture-glow"></div>
            <div className="gesture-icon-avatar">
              {activeSign.type === 'fingerspell' ? '🔤' : '🤟'}
            </div>
            <div className="simulator-token-title">{tokenName}</div>
            <div className="simulator-gesture-desc">{gestureDesc}</div>
            <div className="asset-tag">Missing: frontend/public/signs/{activeSign.asset || `${tokenName}.mp4`}</div>

            {isPlaying && (
              <div className="sim-progress-bar">
                <div
                  className="sim-progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}

        {/* Active Sign Watermark Overlay */}
        {!isCompleted && (
          <div className="sign-watermark">
            <span className="token-type-pill">{activeSign.type || 'word'}</span>
            <span className="token-name-pill">{tokenName}</span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="player-controls-bar">
        <div className="playback-btns">
          <button
            type="button"
            className="ctrl-btn"
            onClick={handlePrev}
            disabled={safeIndex === 0}
            title="Previous Sign"
          >
            ⏮ Prev
          </button>

          <button
            type="button"
            className="ctrl-btn main-play-btn"
            onClick={togglePlayPause}
            title={isPlaying ? "Pause" : isCompleted ? "Replay" : "Play"}
          >
            {isPlaying ? "⏸ Pause" : isCompleted ? "🔄 Replay" : "▶ Play"}
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={handleNext}
            disabled={safeIndex >= totalSigns - 1}
            title="Next Sign"
          >
            Next ⏭
          </button>

          <button
            type="button"
            className="ctrl-btn replay-btn"
            onClick={handleReplay}
            title="Replay Entire Sentence"
          >
            🔄 Replay
          </button>
        </div>
      </div>

      {/* Interactive Sign Timeline Queue */}
      <div className="sign-timeline-queue">
        <span className="queue-label">Sign Timeline (Click to Jump):</span>
        <div className="timeline-scroll">
          {animationSequence.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className={`timeline-node ${idx === safeIndex ? 'active-node' : ''} ${
                idx < safeIndex || isCompleted ? 'completed-node' : ''
              }`}
              onClick={() => {
                setVideoError(false);
                setProgress(0);
                setIsCompleted(false);
                setCurrentIndex(idx);
                setIsPlaying(true);
              }}
            >
              <span className="node-number">{idx + 1}</span>
              <span className="node-text">{item.token}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SignPlayer;
