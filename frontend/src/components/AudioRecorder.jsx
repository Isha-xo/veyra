
import { useEffect, useRef, useState } from 'react';

function AudioRecorder({ onRecordingComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        let timer;

        if (isRecording) {
            timer = setInterval(() => {
                setRecordingTime((previousTime) => previousTime + 1);
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isRecording]);

    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            setError('');

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Microphone access is not supported by this browser.');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

            streamRef.current = stream;

            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/ogg;codecs=opus',
                'audio/mp4',
            ].find((type) => MediaRecorder.isTypeSupported(type));

            const recorder = mimeType
                ? new MediaRecorder(stream, { mimeType })
                : new MediaRecorder(stream);

            chunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, {
                    type: recorder.mimeType,
                });

                onRecordingComplete(audioBlob);

                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            };

            mediaRecorderRef.current = recorder;
            setRecordingTime(0);
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            setError(err.message || 'Unable to access the microphone.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

        return `${minutes}:${remainingSeconds}`;
    };

    return (
        <div className="audio-recorder">
            {!isRecording ? (
                <button className="record-button" onClick={startRecording}>
                    Start Recording
                </button>
            ) : (
                <button className="record-button" onClick={stopRecording}>
                    Stop Recording
                </button>
            )}

            {isRecording && (
                <p className="recording-status">
                    <span className="recording-dot"></span>
                    Listening... Recording in progress
                    <span className="recording-timer">{formatTime(recordingTime)}</span>
                </p>
            )}
            {error && <p role="alert">{error}</p>}
        </div>
    );
}

export default AudioRecorder;
