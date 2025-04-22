import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import AudioRecorder from "./components/AudioRecorder";
import Conversation from "./components/Conversation";
import SettingsPanel from "./components/SettingsPanel";
import { ConversationState, Message, ProficiencyLevel } from "./types";
import { apiService } from "./api/apiService";

const App = () => {
  const [state, setState] = useState<ConversationState>({
    messages: [],
    isRecording: false,
    isProcessing: false,
    proficiencyLevel: "Advanced",
  });

  const handleAudioReady = useCallback(
    async (audioBlob: Blob) => {
      try {
        setState((prev) => ({ ...prev, isProcessing: true }));

        //Add user message first
        const userMessage: Message = {
          id: uuidv4(),
          text: "Processing your speech...",
          isUser: true,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, userMessage],
        }));

        //Send to backend
        const response = await apiService.sendAudio(
          audioBlob,
          state.messages,
          state.proficiencyLevel
        );

        //Update user message with transcribed text
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === userMessage.id
              ? { ...msg, text: response.transcription }
              : msg
          ),
        }));

        //Add AI response
        const aiMessage: Message = {
          id: uuidv4(),
          text: response.response,
          isUser: false,
          audioUrl: response.audioUrl,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          isProcessing: false,
        }));

        //Auto-play the response
        //If you want to automatically play response, please uncomment the following
        //const audio = new Audio(response.audioUrl);
        //audio.play();
      } catch (error) {
        console.error("Error processing audio:", error);
        setState((prev) => ({ ...prev, isProcessing: false }));

        //Add error Message
        const errorMessage: Message = {
          id: uuidv4(),
          text: "Sorry, there was an error processing your speech. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
        }));
      }
    },
    [state.messages, state.proficiencyLevel]
  );

  const handleLevelChange = useCallback((level: ProficiencyLevel) => {
    setState((prev) => ({ ...prev, proficiencyLevel: level }));
  }, []);

  const handleClearConversation = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            AI English Conversation Practice
          </h1>
          <p className="text-center text-gray-600 mt-2">
            Speak naturally with your AI teacher to improve your English
          </p>
        </header>

        <main>
          <SettingsPanel
            proficiencyLevel={state.proficiencyLevel}
            onLevelChange={handleLevelChange}
            onClearConversation={handleClearConversation}
          />

          <Conversation messages={state.messages} />

          <AudioRecorder
            onAudioReady={handleAudioReady}
            isProcessing={state.isProcessing}
          />

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">
              Tips for Practice:
            </h3>
            <ul className="list-disc pl-5 text-blue-700 space-y-1">
              <li>Speak clearly at a natural pace</li>
              <li>Try to use complete sentences</li>
              <li>Ask questions about topics that interest you</li>
              <li>If the AI doesn't understand, try speaking more slowly</li>
              <li>
                Practice everyday situations like ordering food or asking for
                directions
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
