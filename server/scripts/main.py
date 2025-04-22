# Following is a run command
# uvicorn scripts.main:app --host 0.0.0.0 --port 8000

import json
import os
import shutil
import uuid

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel
from transformers import AutoTokenizer
from vllm import LLM, SamplingParams

os.environ["VLLM_WORKER_MULTIPROC_METHOD"] = "spawn"

app = FastAPI(title="AI English Teacher API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Initialize speech recognition
asr_model = WhisperModel("medium.en", "cpu")
print("Load asr model")


# Initialize TTS model
try:
    from TTS.api import TTS

    tts = TTS("tts_models/en/ljspeech/tacotron2-DDC").to("cuda:1")
    print("Load TTS model")
except ImportError:
    raise RuntimeError("Cannot import tts")

# English teacher system prompt
SYSTEM_PROMPT = """You are a professonal level AI English conversation partner designed to help improve speaking skills.
Your goal is to:
1. Engage in natural, flowing conversations in English
2. Gently correct pronunciation, grammar, and vocabulary mistakes
3. Use appropriate idioms and expressions in your responses
4. Adapt to the user's proficiency level
5. Keep your responses concise to maintain conversational flow
6. Responses should be less than 256 words.

Keep your responses friendly, encouraging, and focused on helping the user improve their spoken English.
"""

MODEL_PATH = (
    "ADD here. See vLLM docs"  # Any models, such as "Qwen/Qwen2.5-14B-Instruct"
)

os.makedirs("audio_files", exist_ok=True)
app.mount("/audio_files", StaticFiles(directory="audio_files"), name="audio_files")

LIMIT_HISTORY = 10
max_tokens = 512
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = LLM(
    model=MODEL_PATH,
    tensor_parallel_size=2,
    gpu_memory_utilization=0.85,
    max_seq_len_to_capture=4096,
    max_model_len=4096,
    quantization="fp8",
)
sampling_params = SamplingParams(
    temperature=0.7, top_p=0.8, repetition_penalty=1.05, max_tokens=max_tokens
)


# Speech recognition function
def transcribe_audio(audio_path: str) -> str:
    segments, _ = asr_model.transcribe(audio_path, beam_size=3)
    result = ""
    for segment in segments:
        result += segment.text

    return result


# text-to-speech function
def synthesize_speech(text: str, output_path: str) -> None:
    tts.tts_to_file(text=text, file_path=output_path)


# Generate response from the LLM
def generate_response(message: str, chat_history: list[str], level: str) -> str:
    # Construct the prompt with conversation history
    prompt_parts: list[dict[str, str]] = []

    # Add previous conversation for context (limit to last exchanges)
    for user_msg, assistant_msg in chat_history[-LIMIT_HISTORY:]:
        prompt_parts.append({"role": "user", "content": user_msg})
        prompt_parts.append({"role": "assistant", "content": assistant_msg})

    # Add the current message
    prompt_parts.append({"role": "user", "content": message})

    # Combine with system prompt and adjust for proficiency level
    if level == "Beginner":
        adjusted_prompt = (
            SYSTEM_PROMPT
            + "\nThe user is a beginner, so use simple vocabulary and short sentences."
        )
    elif level == "Intermediate":
        adjusted_prompt = (
            SYSTEM_PROMPT
            + "\nThe user has intermediate proficiency, so use natural language with some challenging vocabulary."
        )
    else:
        adjusted_prompt = (
            SYSTEM_PROMPT
            + "\nThe user is advanced, so use sophisticated vocabulary and complex sentences."
        )

    full_prompt = [{"role": "system", "content": adjusted_prompt}] + prompt_parts

    # Generate response
    text = tokenizer.apply_chat_template(
        full_prompt,
        tokenize=False,
        add_generation_prompt=True,
    )

    outputs = model.generate([text], sampling_params)  # type: ignore
    result = ""
    for r, output in enumerate(outputs):
        generated_text = output.outputs[0].text
        result += generated_text

    return result


@app.post("/process_speech")
async def process_speech(
    audio: UploadFile = File(...),
    level: str = Form(...),
    history: str = Form("[]"),
):
    # Save uploaded audio to a temporary file
    audio_path = f"temp_{uuid.uuid4()}.wav"
    with open(audio_path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    try:
        # Transcribe speech to text
        user_message = transcribe_audio(audio_path=audio_path)

        # Cleanup temporary audio file
        os.remove(audio_path)

        if not user_message.strip():
            return JSONResponse(
                status_code=400,
                content={"error": "Could not transcribe speech. Please try again."},
            )

        # Parse chat history
        chat_history = json.loads(history)

        # Generate text response
        bot_message = generate_response(user_message, chat_history, level)

        print(f"Bot message: {bot_message}")

        # Convert response to speech
        output_filename = f"audio_files/response_{uuid.uuid4()}.wav"
        synthesize_speech(bot_message, output_filename)

        # Return
        return {
            "transcription": user_message,
            "response_text": bot_message,
            "audio_path": f"/{output_filename}",
        }

    except Exception as e:
        print(f"Error processing speech: {str(e)}")
        return JSONResponse(
            status_code=500, content={"error": f"Error processing speech: {str(e)}"}
        )

    finally:
        # Clean up temporary file
        if os.path.exists(audio_path):
            os.remove(audio_path)


@app.get("/")
async def root():
    return {
        "message": "AI English Teacher API is running. Connect your React frontend to start practicing!"
    }
