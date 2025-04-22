import axios from "axios";
import {Message, ProficiencyLevel} from "../types";

//Modify here
const API_URL = "http://localhost:8000";

export const apiService = {
    async sendAudio(
        audioBlob: Blob,
        chatHistory: Message[],
        level: ProficiencyLevel
    ): Promise<{transcription: string; response: string; audioUrl: string}> {
        const formData = new FormData();
        formData.append("audio", audioBlob);
        formData.append("level", level);

        //Convert chat history to the format expected by the backend
        const history = chatHistory.reduce((acc: [string, string][], message, index, array) => {
            if(message.isUser && index + 1 < array.length && !array[index + 1].isUser) {
                acc.push([message.text, array[index + 1].text]);
            }
            return acc;
        }, []);

        formData.append("history", JSON.stringify(history));

        try {
            const response = await axios.post(`${API_URL}/process_speech`, formData, {
                headers: {
                    'Content-Type': "multipart/form-data",
                },
                responseType: "json",
            });

            return {
                transcription: response.data.transcription,
                response: response.data.response_text,
                audioUrl: `${API_URL}${response.data.audio_path}`,
            };
        } catch(error) {
            console.error("Error sending audio:", error);
            throw error;
        }
    }
};