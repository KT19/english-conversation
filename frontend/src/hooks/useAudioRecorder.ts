import {useState, useRef} from "react";

interface AudioRecorderHook {
    isRecording: boolean;
    audioBlob: Blob | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    resetRecording: () => void;
}

export const useAudioRecorder = (): AudioRecorderHook =>{
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if(event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {type: "audio/wav"});
                setAudioBlob(audioBlob);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch(error) {
            console.error("Error starting recording:", error);
        }
    };

    const stopRecording = async (): Promise<void> => {
        if(mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            //Stop all audio tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const resetRecording = (): void => {
        setAudioBlob(null);
    }

    return {
        isRecording,
        audioBlob,
        startRecording,
        stopRecording,
        resetRecording,
    };
};