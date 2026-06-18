import json
import os
import logging
import traceback
import random
from openai import AsyncOpenAI
from pinecone import Pinecone
from dotenv import load_dotenv
from pydantic import BaseModel
from constants import MOVIES_DB_PATH

load_dotenv()

logger = logging.getLogger("recoflix_api")

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Inicjalizacja klienta Pinecone
PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "recoflix-movies")

if PINECONE_API_KEY:
    pc = Pinecone(api_key=PINECONE_API_KEY)
    pinecone_index = pc.Index(PINECONE_INDEX_NAME)
else:
    pinecone_index = None

try:
    with MOVIES_DB_PATH.open("r", encoding="utf-8") as f:
        FULL_MOVIES_DB = json.load(f)
    logger.info(f"Pomyślnie załadowano bazę {len(FULL_MOVIES_DB)} filmów do pamięci.")
    
    MOVIES_BY_ID_MAP = {str(m.get("id")): m for m in FULL_MOVIES_DB}
    
    if pinecone_index is not None:
        logger.info("Pomyślnie zaincjalizowano klienta bazy Pinecone.")
    else:
        logger.warning("Brak klucza PINECONE_API_KEY. Zostanie użyte fallbackowe losowanie.")
        
except Exception as e:
    logger.error("KRYTYCZNY BŁĄD: Nie można załadować plików bazy!")
    logger.error(traceback.format_exc())
    FULL_MOVIES_DB = []
    MOVIES_BY_ID_MAP = {}

class GuardrailResult(BaseModel):
    flagged: bool
    confidence: float
    reason: str

async def generate_movie_recommendation(user_prompt: str, user_history: list[str]) -> str:
    logger.info(f"Otrzymano zapytanie użytkownika: '{user_prompt}'")
    
    guardrail_result = await check_guardrail(user_prompt)
    
    if guardrail_result.reason == "Error fallback":
        return "Ups, chyba zerwała się taśma filmowa w moim systemie! Daj mi sekundę na naprawę i spróbuj zapytać jeszcze raz."
        
    if guardrail_result.flagged and guardrail_result.confidence > 0.7:
        return "Przepraszam, ale jako asystent RecoFlix specjalizuję się wyłącznie w filmach i kinie. O czym filmowym chciałbyś porozmawiać?"

    try:
        if pinecone_index is not None:
            logger.info("Generowanie osadzenia dla zapytania: RAG (Pinecone)...")
            history_text = " ".join(user_history) if user_history else ""
            search_query = f"Szukam filmu: {user_prompt}. Podobne do: {history_text}"
            
            embed_response = await client.embeddings.create(
                input=search_query,
                model="text-embedding-3-small"
            )
            query_embedding = embed_response.data[0].embedding
            
            pinecone_res = pinecone_index.query(
                vector=query_embedding,
                top_k=50,
                include_metadata=False
            )
            
            match_ids = [match.id for match in pinecone_res.matches]
            sampled_movies = [MOVIES_BY_ID_MAP[mid] for mid in match_ids if mid in MOVIES_BY_ID_MAP]
            
            selected_titles = [m.get("title", "Brak tytułu") for m in sampled_movies]
            logger.info(f"Odnaleziono {len(sampled_movies)} podobnych filmów przy użyciu Pinecone RAG. Tytuły: {selected_titles}")
        else:
            logger.warning("Używam losowego fallbacku, ponieważ wektory osadzeń są niedostępne.")
            if len(FULL_MOVIES_DB) > 50:
                sampled_movies = random.sample(FULL_MOVIES_DB, 50)
            else:
                sampled_movies = FULL_MOVIES_DB
    except Exception as e:
        logger.error(f"Błąd podczas szukania podobnych filmów (RAG): {e}. Fallback do losowania.")
        if len(FULL_MOVIES_DB) > 50:
            sampled_movies = random.sample(FULL_MOVIES_DB, 50)
        else:
            sampled_movies = FULL_MOVIES_DB
        
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
        logger.info("Wysyłanie zapytania rekomendacji do OpenAI (z ograniczonym kontekstem)...")
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
        
        raw_output = response.choices[0].message.content
        logger.info("Pomyślnie odebrano odpowiedź z modelu rekomendacji.")
        return raw_output
        
    except Exception as e:
        logger.error(f"BŁĄD w generate_movie_recommendation podczas komunikacji z API: {e}")
        logger.error(traceback.format_exc())
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
        logger.info("Wysyłanie zapytania Guardrail do OpenAI...")
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
        logger.info(f"Surowa odpowiedź JSON z Guardrail: {raw_json}")
        
        result_object = GuardrailResult.model_validate_json(raw_json)
        return result_object
        
    except Exception as e:
        logger.error(f"BŁĄD w check_guardrail: {e}")
        logger.error(traceback.format_exc())
        return GuardrailResult(flagged=False, confidence=0.0, reason="Error fallback")