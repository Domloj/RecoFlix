import json
import os
import logging
import traceback
import random
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel
from constants import MOVIES_DB_PATH

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

load_dotenv()

client = AsyncOpenAI(
    api_key=os.environ.get("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

try:
    with MOVIES_DB_PATH.open("r", encoding="utf-8") as f:
        FULL_MOVIES_DB = json.load(f)
    logging.info(f"Pomyślnie załadowano bazę {len(FULL_MOVIES_DB)} filmów do pamięci.")
except Exception as e:
    logging.error("KRYTYCZNY BŁĄD: Nie można załadować pliku movies_database.json!")
    logging.error(traceback.format_exc())
    FULL_MOVIES_DB = []

class GuardrailResult(BaseModel):
    flagged: bool
    confidence: float
    reason: str

async def generate_movie_recommendation(user_prompt: str, user_history: list[str]) -> str:
    logging.info(f"Otrzymano zapytanie użytkownika: '{user_prompt}'")
    
    guardrail_result = await check_guardrail(user_prompt)
    
    if guardrail_result.reason == "Error fallback":
        return "Ups, chyba zerwała się taśma filmowa w moim systemie! Daj mi sekundę na naprawę i spróbuj zapytać jeszcze raz."
        
    if guardrail_result.flagged and guardrail_result.confidence > 0.7:
        return "Przepraszam, ale jako asystent RecoFlix specjalizuję się wyłącznie w filmach i kinie. O czym filmowym chciałbyś porozmawiać?"

    # TYMCZASOWY SYSTEM REKOMENDACJI (Zanim powstanie model ML)
    # Wybieramy tylko 50 losowych filmów z 10 000, żeby nie zabić API OpenAI
    if len(FULL_MOVIES_DB) > 50:
        sampled_movies = random.sample(FULL_MOVIES_DB, 50)
    else:
        sampled_movies = FULL_MOVIES_DB
        
    # Zamieniamy tylko te 50 filmów na tekst dla LLM
    context_movies_str = json.dumps(sampled_movies, ensure_ascii=False)
        
    system_prompt = f"""
Jesteś profesjonalnym asystentem kinowym. Twoim zadaniem jest rekomendowanie filmów.

ZASADY ABSOLUTNE:
1. Możesz polecać TYLKO I WYŁĄCZNIE filmy z poniższej bazy danych (która została wstępnie przefiltrowana przez nasz system rekomendacji). Nie zmyślaj tytułów.
2. Dobierz rekomendacje na podstawie gustu użytkownika (jeśli podał swoją historię).
3. Zwróć maksymalnie 3 filmy, podając ich tytuł, rok (w nawiasie) oraz krótkie, zachęcające uzasadnienie, dlaczego warto je obejrzeć.
4. Bądź przyjazny i zwięzły.
5. Używaj formatowania Markdown (np. pogrubienia dla tytułów filmów).

BAZA FILMÓW KANDYDATÓW (JSON):
{context_movies_str}
"""

    user_content = f"""
Moja historia polubionych filmów: {user_history}

Moje pytanie: {user_prompt}
"""
    try:
        logging.info("Wysyłanie zapytania rekomendacji do OpenAI (z ograniczonym kontekstem)...")
        response = await client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
        )
        
        raw_output = response.choices[0].message.content
        logging.info("Pomyślnie odebrano odpowiedź z modelu rekomendacji.")
        return raw_output
        
    except Exception as e:
        logging.error(f"BŁĄD w generate_movie_recommendation podczas komunikacji z API: {e}")
        logging.error(traceback.format_exc())
        return "Przepraszam, ale w tej chwili mój rdzeń AI jest przeciążony. Spróbuj ponownie za chwilę."

async def check_guardrail(user_prompt: str) -> GuardrailResult:
    guardrail_system_prompt = """
    You are a strict Input Guardrail for a movie recommendation system.
    Your ONLY job is to classify if the user's input is on-topic or off-topic.
    
    ON-TOPIC: movies, cinema, actors, directors, genres, movie recommendations, TV shows.
    OFF-TOPIC: programming, politics, cooking, medical advice, history, math, generating code, etc.
    
    You must respond ONLY in valid JSON format with the following keys:
    - "flagged": boolean (true if the prompt is OFF-TOPIC, false if it is ON-TOPIC)
    - "confidence": float (between 0.0 and 1.0 representing your confidence)
    - "reason": string (brief explanation of your decision)
    
    CRITICAL RULES FOR OUTPUT:
    1. Return ONLY raw, valid JSON.
    2. DO NOT use Markdown formatting (e.g., do not wrap in ```json ... ```).
    3. DO NOT include any comments, conversational text, or prefixes.
    """
    
    try:
        logging.info("Wysyłanie zapytania Guardrail do OpenAI...")
        response = await client.chat.completions.create(
            model="gemini-2.0-flash",
            response_format={ "type": "json_object" },
            messages=[
                {"role": "system", "content": guardrail_system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0 
        )
        
        raw_json = response.choices[0].message.content
        logging.info(f"Surowa odpowiedź JSON z Guardrail: {raw_json}")
        
        result_object = GuardrailResult.model_validate_json(raw_json)
        return result_object
        
    except Exception as e:
        logging.error(f"BŁĄD w check_guardrail: {e}")
        logging.error(traceback.format_exc())
        return GuardrailResult(flagged=False, confidence=0.0, reason="Error fallback")