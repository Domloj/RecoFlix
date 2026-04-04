import json
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

with open("../data/movies_database.json", "r", encoding="utf-8") as f:
    MOVIES_DB_STR = json.dumps(json.load(f)) 

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

async def generate_movie_recommendation(user_prompt: str, user_history: list[str]) -> str:
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