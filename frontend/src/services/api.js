
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Check whether the backend is running
export const checkBackendHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);

        if (!response.ok) {
            throw new Error('Backend health check failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Backend connection error:', error);
        throw error;
    }
};

// Send audio to the speech recognition API
export const transcribeAudio = async (audioBlob, language = null) => {
    const formData = new FormData();

    const mimeType = audioBlob.type.toLowerCase();

    const extension = mimeType.includes('ogg')
        ? 'ogg'
        : mimeType.includes('mp4')
            ? 'm4a'
            : mimeType.includes('wav')
                ? 'wav'
                : mimeType.includes('mpeg') || mimeType.includes('mp3')
                    ? 'mp3'
                    : mimeType.includes('flac')
                        ? 'flac'
                        : mimeType.includes('aac')
                            ? 'aac'
                            : 'webm';

    formData.append('file', audioBlob, `recording.${extension}`);

    const query = language
        ? `?language=${encodeURIComponent(language)}`
        : '';

    const response = await fetch(
        `${API_BASE_URL}/transcribe${query}`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Transcription failed');
    }

    return await response.json();
};
