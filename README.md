# RecoFlix

RecoFlix is a web application that combines a React frontend with a FastAPI backend handling Firebase authentication, an OpenAI-powered movie chatbot, and a hybrid recommendation engine that uses Pinecone and MovieLens data.

## Technology Stack
* **Frontend:** React (Vite), TypeScript, Mantine UI, Vitest
* **Backend:** Python, FastAPI, Pytest, OpenAI API, Pinecone
* **Cloud / Auth:** Firebase
* [Vercel](https://recoflix.vercel.app/)

---

## How does the project work?

The backend is more than a simple movie-list API. In practice, it is made of several connected layers:

* **Authentication and session handling** are based on Firebase. Most endpoints require a signed-in user.
* **The movie chatbot** uses the OpenAI API. It first checks whether the prompt is on-topic for movies, then retrieves candidate answers through Pinecone-powered RAG.
* **The Pinecone vector database** stores movie embeddings generated from the title, genres, and description. Those vectors are used by both the chatbot and the recommendation engine.
* **The recommendation engine** combines semantic similarity from Pinecone with collaborative filtering based on MovieLens. This makes the recommendations reflect both movie content and the behavior of similar users.
* **Additional metadata** such as posters is fetched from TMDB, and when unavailable, the app falls back to a default placeholder.

### Data flow

1. The script `api/scripts/generate_embeddings.py` loads movies from `data/movies_database.json`.
2. For each movie, it generates an OpenAI embedding (`text-embedding-3-small`).
3. The embedding is stored in Pinecone under the `recoflix-movies` index.
4. The chatbot and recommendation features retrieve similar movies from Pinecone, then filter and rank the results.
5. The recommendation engine blends Pinecone results with the MovieLens rating matrix and returns a short XAI explanation.

### Backend endpoints

* `GET /api/engine-status` - quick status of the API and recommendation engine.
* `POST /api/chat/` - movie chatbot returning an OpenAI-generated response.
* `GET /api/recommendations/` - recommendations for a single movie.
* `POST /api/recommendations/for-user` - recommendations based on a list of liked movies.

---

## How to run the project locally?

### 1. Backend (AI engine and API)
⚠️ **Important:** Before you start, make sure you have the Firebase private key (`serviceAccountKey.json`) and placed it in the `api/` folder. If you want to run the chatbot and vector-based recommendations, you also need `OPENAI_API_KEY` and `PINECONE_API_KEY` configured.

```bash
cd api
pip install -r requirements.txt
uvicorn index:app --reload
```

The API will be available at: `http://localhost:8000` (Swagger docs: `/docs`)

### 2. Frontend (User Interface)
⚠️ **Important:** Make sure you have a `.env.local` file configured with the public Firebase keys for React.

```bash
cd frontend
npm install
npm run dev
```

The app will run at: `http://localhost:5173`

### 3. Generate Pinecone embeddings

If you want to refresh the vector movie database, run the embedding generation script:

```bash
cd api
python scripts/generate_embeddings.py
```

The script creates or updates the Pinecone index `recoflix-movies` based on the data in `data/movies_database.json`.

---

## Automated tests

The project is connected to GitHub Actions, which means every push to main and every pull request is checked automatically. You can also run the tests manually:

**Frontend tests (React):**
```bash
cd frontend
npx vitest
```

**Backend tests (FastAPI):**
```bash
cd api
pytest -v
```
