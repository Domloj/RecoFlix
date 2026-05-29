# import pandas as pd
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# import logging
# import os
# import requests

# from constants import (
#     DEFAULT_POSTER_URL,
#     LINKS_CSV_PATH,
#     MOVIES_CSV_PATH,
#     RATINGS_CSV_PATH,
#     TMDB_BASE_URL,
#     TMDB_IMAGE_BASE_URL,
# )

# logging.basicConfig(level=logging.INFO)

# class HybridRecommender:
#     def __init__(self):
#         self.movies = None
#         self.links = None
#         self.cosine_sim_cb = None
#         self.cosine_sim_cf = None
#         self.is_ready = False
#         self.tmdb_api_key = os.getenv("TMDB_API_KEY")

#     def initialize(self):
#         logging.info("Rozpoczynam inicjalizację macierzy (Pre-computing)...")

#         self.movies = pd.read_csv(MOVIES_CSV_PATH)
#         ratings = pd.read_csv(RATINGS_CSV_PATH)
#         self.links = pd.read_csv(LINKS_CSV_PATH)

#         # Macierz Content-Based
#         tfidf = TfidfVectorizer(token_pattern=r'[a-zA-Z0-9\-]+')
#         tfidf_matrix = tfidf.fit_transform(self.movies['genres'].fillna(''))
#         self.cosine_sim_cb = cosine_similarity(tfidf_matrix, tfidf_matrix)

#         # Macierz Collaborative Filtering
#         user_item_matrix = ratings.pivot(index='movieId', columns='userId', values='rating').fillna(0)
#         user_item_matrix = user_item_matrix.reindex(self.movies['movieId'], fill_value=0)
#         self.cosine_sim_cf = cosine_similarity(user_item_matrix)

#         self.is_ready = True
#         logging.info("Silnik rekomendacji hybrydowych gotowy do pracy!")

#     def _fetch_poster_url(self, tmdb_id: float) -> str:
#         """Pobiera oficjalny adres URL plakatu z bazy TMDB."""
#         default_poster = DEFAULT_POSTER_URL

#         if pd.isna(tmdb_id) or not self.tmdb_api_key:
#             return default_poster
            
#         url = f"{TMDB_BASE_URL}/{int(tmdb_id)}?api_key={self.tmdb_api_key}"
#         try:
#             # Wysyłamy zapytanie do TMDB
#             response = requests.get(url, timeout=3)
#             if response.status_code == 200:
#                 data = response.json()
#                 poster_path = data.get("poster_path")
#                 if poster_path:
#                     return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
#         except Exception as e:
#             logging.error(f"Błąd podczas pobierania plakatu z TMDB: {e}")
            
#         return default_poster

#     def get_recommendations(self, target_title: str, alpha: float = 0.5, top_n: int = 5):
#         if not self.is_ready:
#             raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

#         try:
#             idx = self.movies[self.movies['title'].str.contains(target_title, case=False, na=False, regex=False)].index[0]
#         except IndexError:
#             return None 
            
#         base_movie_title = self.movies['title'].iloc[idx]
        
#         cb_scores = self.cosine_sim_cb[idx]
#         cf_scores = self.cosine_sim_cf[idx]
#         hybrid_scores = alpha * cb_scores + (1 - alpha) * cf_scores
        
#         sim_scores = sorted(list(enumerate(hybrid_scores)), key=lambda x: x[1], reverse=True)
#         top_movies = sim_scores[1:top_n+1]
        
#         results = []
#         for i, score in top_movies:
#             contrib_cb = alpha * cb_scores[i]
#             contrib_cf = (1 - alpha) * cf_scores[i]
#             total_contrib = contrib_cb + contrib_cf
            
#             pct_cb = (contrib_cb / total_contrib * 100) if total_contrib > 0 else 0
#             pct_cf = (contrib_cf / total_contrib * 100) if total_contrib > 0 else 0

#             if pct_cb > 60:
#                 explanation = f"Film polecany głównie dlatego, że idealnie pokrywa się z klimatem '{base_movie_title}'."
#             elif pct_cf > 60:
#                 explanation = f"Ten tytuł to hit społeczności. Widzowie oceniający wysoko '{base_movie_title}' masowo go oglądają."
#             else:
#                 explanation = f"Zrównoważony wybór. Świetnie pasuje do '{base_movie_title}' i cieszy się uznaniem wśród podobnych do Ciebie widzów."

#             movie_id = self.movies['movieId'].iloc[i]
#             tmdb_id_row = self.links[self.links['movieId'] == movie_id]
#             tmdb_id = tmdb_id_row['tmdbId'].values[0] if not tmdb_id_row.empty else None
            
#             poster_url = self._fetch_poster_url(tmdb_id)

#             results.append({
#                 "movie_id": int(movie_id),
#                 "title": str(self.movies['title'].iloc[i]),
#                 "poster_url": poster_url, 
#                 "score": float(score),
#                 "xai": {
#                     "content_contribution_pct": float(pct_cb),
#                     "collaborative_contribution_pct": float(pct_cf),
#                     "human_explanation": explanation
#                 }
#             })
#         return results

#     def get_recommendations_for_user(self, liked_movie_ids: list[int], alpha: float = 0.5, top_n: int = 10):
#         if not self.is_ready:
#             raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

#         # Mapuj liked_movie_ids → indeksy w self.movies (silnik operuje na indeksach DataFrame)
#         liked_indices = []
#         for movie_id in liked_movie_ids:
#             rows = self.movies[self.movies['movieId'] == movie_id]
#             if not rows.empty:
#                 liked_indices.append(rows.index[0])

#         if not liked_indices:
#             return None

#         # Zsumuj i uśrednij hybrid_scores ze wszystkich polubionych filmów
#         import numpy as np
#         cb_agg = np.zeros(len(self.movies))
#         cf_agg = np.zeros(len(self.movies))

#         for idx in liked_indices:
#             cb_agg += self.cosine_sim_cb[idx]
#             cf_agg += self.cosine_sim_cf[idx]

#         cb_agg /= len(liked_indices)
#         cf_agg /= len(liked_indices)

#         hybrid_scores = alpha * cb_agg + (1 - alpha) * cf_agg

#         # Wyklucz filmy, które użytkownik już polubił
#         for idx in liked_indices:
#             hybrid_scores[idx] = 0.0

#         sim_scores = sorted(enumerate(hybrid_scores), key=lambda x: x[1], reverse=True)
#         top_movies = sim_scores[:top_n]

#         results = []
#         for i, score in top_movies:
#             contrib_cb = alpha * cb_agg[i]
#             contrib_cf = (1 - alpha) * cf_agg[i]
#             total_contrib = contrib_cb + contrib_cf

#             pct_cb = (contrib_cb / total_contrib * 100) if total_contrib > 0 else 0
#             pct_cf = (contrib_cf / total_contrib * 100) if total_contrib > 0 else 0

#             if pct_cb > 60:
#                 explanation = "Pasuje gatunkowo i klimatem do filmów, które polubiłaś."
#             elif pct_cf > 60:
#                 explanation = "Hit wśród widzów o podobnym guście do Twojego."
#             else:
#                 explanation = "Zrównoważony wybór — pasuje zarówno stylem, jak i gustami podobnych widzów."

#             movie_id = self.movies['movieId'].iloc[i]
#             tmdb_id_row = self.links[self.links['movieId'] == movie_id]
#             tmdb_id = tmdb_id_row['tmdbId'].values[0] if not tmdb_id_row.empty else None

#             results.append({
#                 "movie_id": int(movie_id),
#                 "title": str(self.movies['title'].iloc[i]),
#                 "poster_url": self._fetch_poster_url(tmdb_id),
#                 "score": float(score),
#                 "xai": {
#                     "content_contribution_pct": float(pct_cb),
#                     "collaborative_contribution_pct": float(pct_cf),
#                     "human_explanation": explanation
#                 }
#             })

#         return results

# recommender = HybridRecommender()

# backend/services/recommender_engine.py

import json
import logging
import os
import re

import numpy as np
import pandas as pd
import requests
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from constants import (
    DATA_DIR,
    DEFAULT_POSTER_URL,
    LINKS_CSV_PATH,
    MOVIES_CSV_PATH,
    RATINGS_CSV_PATH,
    TAGS_CSV_PATH,
    TMDB_BASE_URL,
    TMDB_IMAGE_BASE_URL,
)

logging.basicConfig(level=logging.INFO)

EMBEDDINGS_PATH = DATA_DIR / "embeddings_minilm.npy"
OVERVIEWS_CACHE_PATH = DATA_DIR / "overviews_cache.json"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


class HybridRecommender:
    def __init__(self):
        self.movies = None
        self.links = None
        self.cosine_sim_cb = None
        self.cosine_sim_cf = None
        self.is_ready = False
        self.tmdb_api_key = os.getenv("TMDB_API_KEY")
        self.tmdb_language = os.getenv("TMDB_LANGUAGE", "pl-PL")

    # Inicjalizacja

    def initialize(self):
        logging.info("Rozpoczynam inicjalizację silnika v2 (embeddingi + SHAP)...")

        self.movies = pd.read_csv(MOVIES_CSV_PATH)
        ratings = pd.read_csv(RATINGS_CSV_PATH)
        self.links = pd.read_csv(LINKS_CSV_PATH)
        self.links["tmdbId"] = pd.to_numeric(self.links["tmdbId"], errors="coerce").astype("Int64")
        self.movies = self.movies.merge(self.links[["movieId", "tmdbId"]], on="movieId", how="left")

        # Opisy fabuły z cache TMDB
        self.movies["overview"] = self._load_overviews()
        self.movies["text"] = self.movies.apply(self._build_text, axis=1)

        # Macierz Content-Based — embeddingi
        self.cosine_sim_cb = self._build_cb_matrix()

        # Macierz Collaborative Filtering
        user_item_matrix = ratings.pivot(index="movieId", columns="userId", values="rating").fillna(0)
        user_item_matrix = user_item_matrix.reindex(self.movies["movieId"], fill_value=0)
        self.cosine_sim_cf = cosine_similarity(user_item_matrix)

        self.is_ready = True
        logging.info("Silnik rekomendacji v2 gotowy!")

    def _load_overviews(self) -> pd.Series:
        """Wczytuje opisy fabuły z lokalnego cache TMDB."""
        if not OVERVIEWS_CACHE_PATH.exists():
            logging.warning("Brak overviews_cache.json — CB będzie oparte wyłącznie na gatunkach.")
            return pd.Series([None] * len(self.movies))

        with OVERVIEWS_CACHE_PATH.open("r", encoding="utf-8") as f:
            cache = json.load(f)

        overviews = []
        for _, row in self.movies.iterrows():
            tmdb_id = row.get("tmdbId")
            if pd.isna(tmdb_id):
                overviews.append(None)
            else:
                overviews.append(cache.get(str(int(tmdb_id))))

        filled = sum(1 for o in overviews if o)
        logging.info(f"Opisy fabuły: {filled}/{len(self.movies)} filmów ({filled/len(self.movies)*100:.1f}%)")
        return pd.Series(overviews)

    def _build_text(self, row: pd.Series) -> str:
        genres = row["genres"].replace("|", " ") if pd.notna(row["genres"]) else ""
        overview = row["overview"] if pd.notna(row.get("overview")) else ""
        parts = [p for p in [overview, genres] if p]
        return " ".join(parts)

    def _build_cb_matrix(self) -> np.ndarray:
        """Buduje macierz CB z embeddingów — z cache lub od nowa."""
        if EMBEDDINGS_PATH.exists():
            logging.info("Wczytano embeddingi z cache.")
            embeddings = np.load(EMBEDDINGS_PATH)
        else:
            logging.info(f"Generuję embeddingi modelem {EMBEDDING_MODEL_NAME}...")
            model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            embeddings = model.encode(
                self.movies["text"].tolist(),
                show_progress_bar=True,
                batch_size=64,
            )
            np.save(EMBEDDINGS_PATH, embeddings)
            logging.info(f"Embeddingi zapisane: {embeddings.shape}")

        return cosine_similarity(embeddings, embeddings)

    # SHAP

    def _get_shap_explanation(self, base_idx: int, rec_idx: int, alpha: float) -> str:
        """
        Wyjaśnienie oparte na bezpośredniej analizie cech.
        Szybkie i deterministyczne — bez narzutu SHAP na produkcji.
        """
        try:
            base_genres = set(self.movies["genres"].iloc[base_idx].split("|"))
            rec_genres = set(self.movies["genres"].iloc[rec_idx].split("|"))
            common_genres = base_genres & rec_genres
            common_genres.discard("(no genres listed)")

            cb_score = float(self.cosine_sim_cb[base_idx, rec_idx])
            cf_score = float(self.cosine_sim_cf[base_idx, rec_idx])

            # Dominuje CF
            if cf_score > cb_score * 1.5:
                return "Wysoko oceniany przez widzów o bardzo podobnym guście do Twojego."

            # Dominuje CB — mamy wspólne gatunki
            if common_genres:
                top_genre = sorted(common_genres)[0]
                if len(common_genres) >= 3:
                    return f"Bardzo zbliżony klimatem — łączy go z polubionym filmem aż {len(common_genres)} wspólnych gatunków, w tym '{top_genre}'."
                return f"Gatunek '{top_genre}' najbardziej zbliża ten film do Twoich ulubionych."

            # CB dominuje ale brak wspólnych gatunków — podobieństwo fabularne z embeddingów
            if cb_score > 0.5:
                return "Bardzo podobna fabuła i klimat do filmów, które polubiłaś."

            # Wyrównany wynik
            return "Zrównoważony wybór — pasuje zarówno klimatem, jak i gustami podobnych widzów."

        except Exception as e:
            logging.warning(f"Błąd generowania wyjaśnienia: {e}")
            return "Rekomendowany na podstawie Twojego profilu filmowego."

    @staticmethod
    def _fallback_explanation(base_idx: int, pct_cb: float, pct_cf: float) -> str:
        if pct_cb > 60:
            return "Pasuje gatunkowo i klimatem do filmów, które polubiłaś."
        if pct_cf > 60:
            return "Hit wśród widzów o podobnym guście do Twojego."
        return "Zrównoważony wybór — pasuje zarówno stylem, jak i gustami podobnych widzów."

    def get_recommendations(self, target_title: str, alpha: float = 0.5, top_n: int = 5):
        """Rekomendacje dla pojedynczego tytułu (endpoint GET /api/recommendations/)."""
        if not self.is_ready:
            raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

        try:
            idx = self.movies[
                self.movies["title"].str.contains(target_title, case=False, na=False, regex=False)
            ].index[0]
        except IndexError:
            return None

        cb_scores = self.cosine_sim_cb[idx]
        cf_scores = self.cosine_sim_cf[idx]
        hybrid_scores = alpha * cb_scores + (1 - alpha) * cf_scores

        sim_scores = sorted(enumerate(hybrid_scores), key=lambda x: x[1], reverse=True)
        top_movies = sim_scores[1 : top_n + 1]

        return [self._build_result(i, score, idx, cb_scores, cf_scores, alpha) for i, score in top_movies]

    def get_recommendations_for_user(
        self, liked_movie_ids: list[int], alpha: float = 0.5, top_n: int = 10
    ):
        """Rekomendacje dla użytkownika na podstawie listy polubionych filmów."""
        if not self.is_ready:
            raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

        liked_indices = []
        for movie_id in liked_movie_ids:
            rows = self.movies[self.movies["movieId"] == movie_id]
            if not rows.empty:
                liked_indices.append(rows.index[0])

        if not liked_indices:
            return None

        cb_agg = np.zeros(len(self.movies))
        cf_agg = np.zeros(len(self.movies))
        for idx in liked_indices:
            cb_agg += self.cosine_sim_cb[idx]
            cf_agg += self.cosine_sim_cf[idx]
        cb_agg /= len(liked_indices)
        cf_agg /= len(liked_indices)

        hybrid_scores = alpha * cb_agg + (1 - alpha) * cf_agg
        for idx in liked_indices:
            hybrid_scores[idx] = 0.0

        sim_scores = sorted(enumerate(hybrid_scores), key=lambda x: x[1], reverse=True)[:top_n]

        # Dla for-user: jako "base" używamy pierwszego polubionego (dla SHAP i wyjaśnień)
        base_idx = liked_indices[0]
        return [self._build_result(i, score, base_idx, cb_agg, cf_agg, alpha) for i, score in sim_scores]

    def _build_result(
        self,
        rec_idx: int,
        score: float,
        base_idx: int,
        cb_scores: np.ndarray,
        cf_scores: np.ndarray,
        alpha: float,
    ) -> dict:
        contrib_cb = alpha * cb_scores[rec_idx]
        contrib_cf = (1 - alpha) * cf_scores[rec_idx]
        total = contrib_cb + contrib_cf
        pct_cb = contrib_cb / total * 100 if total > 0 else 0
        pct_cf = contrib_cf / total * 100 if total > 0 else 0

        explanation = self._get_shap_explanation(base_idx, rec_idx, alpha)

        movie_id = self.movies["movieId"].iloc[rec_idx]
        tmdb_row = self.links[self.links["movieId"] == movie_id]
        tmdb_id = tmdb_row["tmdbId"].values[0] if not tmdb_row.empty else None

        return {
            "movie_id": int(movie_id),
            "title": str(self.movies["title"].iloc[rec_idx]),
            "poster_url": self._fetch_poster_url(tmdb_id),
            "score": float(score),
            "xai": {
                "content_contribution_pct": float(pct_cb),
                "collaborative_contribution_pct": float(pct_cf),
                "human_explanation": explanation,
            },
        }

    def _fetch_poster_url(self, tmdb_id) -> str:
        if pd.isna(tmdb_id) or not self.tmdb_api_key:
            return DEFAULT_POSTER_URL
        try:
            r = requests.get(
                f"{TMDB_BASE_URL}/{int(tmdb_id)}",
                params={"api_key": self.tmdb_api_key, "language": self.tmdb_language},
                timeout=3,
            )
            if r.status_code == 200:
                poster_path = r.json().get("poster_path")
                if poster_path:
                    return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
        except Exception as e:
            logging.error(f"Błąd TMDB: {e}")
        return DEFAULT_POSTER_URL


recommender = HybridRecommender()