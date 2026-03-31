from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RecoFlix API")

# Konfiguracja CORS (kluczowe, by React z portu 5173 mógł gadać z Pythonem z portu 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint testowy
@app.get("/")
def read_root():
    return {"message": "Witaj w API RecoFlix!"}

# Endpoint z naszymi rekomendacjami i XAI (na razie zwracamy mock data)
@app.get("/api/recommendations")
def get_recommendations():
    return [
        {
            "id": 1,
            "title": "Incepcja (2010)",
            "match": 98,
            "desc": "Złodziej, który wykrada korporacyjne sekrety za pomocą technologii współdzielenia snów...",
            "image": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            "xaiReasons": [
                {"label": "Ulubiony reżyser (Nolan)", "value": 45, "color": "blue"},
                {"label": "Gatunek (Sci-Fi)", "value": 30, "color": "grape"},
                {"label": "Podobni użytkownicy", "value": 25, "color": "teal"}
            ]
        }
    ]