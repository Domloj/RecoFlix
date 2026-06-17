import json
import os
import sys
from pathlib import Path
from openai import OpenAI
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv

current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
sys.path.append(str(backend_dir))

from constants import MOVIES_DB_PATH

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

PINECONE_API_KEY = os.environ.get("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.environ.get("PINECONE_INDEX_NAME", "recoflix-movies")

if not PINECONE_API_KEY:
    print("BŁĄD: Brak zmiennej PINECONE_API_KEY w pliku .env!")
    sys.exit(1)

pc = Pinecone(api_key=PINECONE_API_KEY)

def init_pinecone_index():
    existing_indexes = [index_info["name"] for index_info in pc.list_indexes()]
    if PINECONE_INDEX_NAME not in existing_indexes:
        print(f"Tworzenie nowego indeksu Pinecone: {PINECONE_INDEX_NAME}...")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=1536,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(PINECONE_INDEX_NAME)

def generate_embeddings():
    print("Ładowanie bazy filmów...")
    with MOVIES_DB_PATH.open("r", encoding="utf-8") as f:
        movies = json.load(f)
        
    print(f"Znaleziono {len(movies)} filmów. Włączam łączenie z Pinecone...")
    pinecone_index = init_pinecone_index()
    
    batch_size = 1000
    
    for i in range(0, len(movies), batch_size):
        batch = movies[i:i+batch_size]
        texts = []
        ids = []
        
        for m in batch:
            movie_id = str(m.get("id"))
            title = m.get('title', '')
            genres = ", ".join(m.get('genres', []))
            desc = m.get('description', '')
            
            ids.append(movie_id)
            texts.append(f"Tytuł: {title}. Gatunki: {genres}. Opis: {desc}")
            
        print(f"Generowanie wektorów dla batcha {i} do {i + len(batch)}...")
        response = client.embeddings.create(
            input=texts,
            model="text-embedding-3-small"
        )
        
        vectors_to_upsert = []
        for j, data in enumerate(response.data):
            vectors_to_upsert.append((
                ids[j],
                data.embedding,
                {"title": batch[j].get("title", "")}
            ))
            
        print(f"Upsertowanie (wysyłanie) wektorów do Pinecone...")
        for chunk_i in range(0, len(vectors_to_upsert), 100):
            pinecone_index.upsert(vectors=vectors_to_upsert[chunk_i:chunk_i+100])
            
    print("Sukces! Zapisano wszystkie wektory do bazy Pinecone.")

if __name__ == "__main__":
    generate_embeddings()
