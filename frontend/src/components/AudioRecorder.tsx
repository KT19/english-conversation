import { useEffect } from "react";
import { FaMicrophone, FaStop, FaSpinner } from "react-icons/fa";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface AudioRecorderProps {
  onAudioReady: (blob: Blob) => void;
  isProcessing: boolean;
}

const AudioRecorder = ({ onAudioReady, isProcessing }: AudioRecorderProps) => {
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob && !isRecording) {
      onAudioReady(audioBlob);
      resetRecording();
    }
  }, [audioBlob, isRecording, onAudioReady, resetRecording]);

  return (
    <div className="flex items-center justify-center mt-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`flex items-center justify-center w-16 h-16 rounded-full ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white focus:outline-none transition-colors duration-200`}
      >
        {isProcessing ? (
          <FaSpinner className="animate-spin w-6 h-6" />
        ) : isRecording ? (
          <FaStop className="w-6 h-6" />
        ) : (
          <FaMicrophone className="w-6 h-6" />
        )}
      </button>
      <div className="ml-4 text-gray-600">
        {isRecording ? (
          <span className="text-red-500 animate-pulse">Recording...</span>
        ) : isProcessing ? (
          <span>Processing your speech...</span>
        ) : (
          <span>Click to start speaking</span>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
