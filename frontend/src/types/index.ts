export type ProficiencyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Message {
    id: string;
    text: string;
    isUser: boolean;
    audioUrl?: string;
    timestamp: Date;
};

export interface ConversationState {
    messages: Message[];
    isRecording: boolean;
    isProcessing: boolean;
    proficiencyLevel: ProficiencyLevel;
};
