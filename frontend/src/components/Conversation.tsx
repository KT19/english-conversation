import { useRef, useEffect } from "react";
import { Message } from "../types";
import { FaUser, FaRobot } from "react-icons/fa";

interface ConversationProps {
  messages: Message[];
}

const Conversation = ({ messages }: ConversationProps) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-6">
        <FaRobot className="text-gray-400 w-12 h-12 mb-4" />
        <p className="text-gray-500 text-center">
          Start speaking to begin a conversation with your AI English teacher.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-h-96 overflow-y-auto">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.isUser ? "justify-end" : "justify-start"
          } mb-4`}
        >
          <div
            className={`flex max-w-3/4 ${
              message.isUser
                ? "bg-blue-100 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                : "bg-gray-100 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
            } p-3`}
          >
            <div className="flex-shrink-0 mr-2">
              {message.isUser ? (
                <FaUser className="text-blue-500 w-5 h-5" />
              ) : (
                <FaRobot className="text-gray-600 w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-gray-800">{message.text}</p>
              {message.audioUrl && !message.isUser && (
                <audio
                  controls
                  src={message.audioUrl}
                  className="mt-2 w-full"
                />
              )}
              <span className="text-xs text-gray-500 block mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default Conversation;
