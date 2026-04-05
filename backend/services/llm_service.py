import json
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
with open("../data/movies_database.json", "r", encoding="utf-8") as f:
    MOVIES_DB_STR = json.dumps(json.load(f)) 

class GuardrailResult(BaseModel):
    flagged: bool
    confidence: float
    reason: str

async def generate_movie_recommendation(user_prompt: str, user_history: list[str]) -> str:
    guardrail_result = await check_guardrail(user_prompt)
    
    if guardrail_result.reason == "Error fallback":
        return "Ups, chyba zerwała się taśma filmowa w moim systemie! Daj mi sekundę na naprawę i spróbuj zapytać jeszcze raz."
        
    if guardrail_result.flagged and guardrail_result.confidence > 0.7:
        return "Przepraszam, ale jako asystent RecoFlix specjalizuję się wyłącznie w filmach i kinie. O czym filmowym chciałbyś porozmawiać?"
        
    system_prompt = f"""
Jesteś profesjonalnym asystentem kinowym. Twoim zadaniem jest rekomendowanie filmów.

ZASADY ABSOLUTNE:
1. Możesz polecać TYLKO I WYŁĄCZNIE filmy z poniższej bazy danych. Nie zmyślaj tytułów.
2. Dobierz rekomendacje na podstawie gustu użytkownika (jeśli podał swoją historię).
3. Zwróć maksymalnie 3 filmy, podając ich tytuł, rok (w nawiasie) oraz krótkie, zachęcające uzasadnienie, dlaczego warto je obejrzeć.
4. Bądź przyjazny i zwięzły.
5. Używaj formatowania Markdown (np. pogrubienia dla tytułów filmów).

BAZA FILMÓW (JSON):
{MOVIES_DB_STR}
"""

    user_content = f"""
Moja historia polubionych filmów: {user_history}

Moje pytanie: {user_prompt}
"""
    try:
        response = await client.chat.completions.create(
            model="gpt-5.1", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            prompt_cache_key="recoflix_movielens_db",
            prompt_cache_retention="24h"
        )
        return response.choices[0].message.content
    except Exception as e:
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
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={ "type": "json_object" }, 
            messages=[
                {"role": "system", "content": guardrail_system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0 
        )
        
        raw_json = response.choices[0].message.content
        
        result_object = GuardrailResult.model_validate_json(raw_json)
        return result_object
        
    except Exception as e:
        return GuardrailResult(flagged=False, confidence=0.0, reason="Error fallback")