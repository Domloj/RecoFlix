import json
import logging
import os
import re

import numpy as np
import pandas as pd
import requests
from pinecone import Pinecone
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

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

load_dotenv()

logger = logging.getLogger("recoflix_api")


class HybridRecommender:
    def __init__(self):
        self.movies = None
        self.links = None
        self.cosine_sim_cf = None
        self.is_ready = False
        self.tmdb_api_key = os.getenv("TMDB_API_KEY")
        self.tmdb_language = os.getenv("TMDB_LANGUAGE", "pl-PL")

        # Inicjalizacja chmury
        self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
        self.pinecone_index = pc.Index(os.environ.get("PINECONE_INDEX_NAME", "recoflix-movies"))

    # Inicjalizacja
    def initialize(self):
        logger.info("Rozpoczynam inicjalizację silnika v2 (Pinecone + CF)...")

        self.movies = pd.read_csv(MOVIES_CSV_PATH)
        ratings = pd.read_csv(RATINGS_CSV_PATH)
        self.links = pd.read_csv(LINKS_CSV_PATH)
        self.links["tmdbId"] = pd.to_numeric(self.links["tmdbId"], errors="coerce").astype("Int64")
        self.movies = self.movies.merge(self.links[["movieId", "tmdbId"]], on="movieId", how="left")

        # Macierz Collaborative Filtering (zostaje w pamięci)
        user_item_matrix = ratings.pivot(index="movieId", columns="userId", values="rating").fillna(0)
        user_item_matrix = user_item_matrix.reindex(self.movies["movieId"], fill_value=0)
        self.cosine_sim_cf = cosine_similarity(user_item_matrix)

        self.is_ready = True
        logger.info("Silnik rekomendacji v2 gotowy!")

    # SHAP
    def _get_shap_explanation(self, base_idx: int, rec_idx: int, cb_score: float, cf_score: float) -> str:
        """
        Wyjaśnienie oparte na bezpośredniej analizie cech.
        Szybkie i deterministyczne - bez narzutu SHAP na produkcji.
        """
        try:
            base_genres = set(self.movies["genres"].iloc[base_idx].split("|"))
            rec_genres = set(self.movies["genres"].iloc[rec_idx].split("|"))
            common_genres = base_genres & rec_genres
            common_genres.discard("(no genres listed)")

            # Dominuje CF
            if cf_score > cb_score * 1.5:
                return "Wysoko oceniany przez widzów o bardzo podobnym guście do Twojego."

            # Dominuje CB - mamy wspólne gatunki
            if common_genres:
                top_genre = sorted(common_genres)[0]
                if len(common_genres) >= 3:
                    return f"Bardzo zbliżony klimatem - łączy go z polubionym filmem aż {len(common_genres)} wspólnych gatunków, w tym '{top_genre}'."
                return f"Gatunek '{top_genre}' najbardziej zbliża ten film do Twoich ulubionych."

            # CB dominuje ale brak wspólnych gatunków - podobieństwo fabularne z embeddingów
            if cb_score > 0.5:
                return "Bardzo podobna fabuła i klimat do filmów, które polubiłaś."

            # Wyrównany wynik
            return "Zrównoważony wybór - pasuje zarówno klimatem, jak i gustami podobnych widzów."

        except Exception as e:
            logger.warning(f"Błąd generowania wyjaśnienia: {e}")
            return "Rekomendowany na podstawie Twojego profilu filmowego."

    def get_recommendations(self, target_title: str, alpha: float = 0.5, top_n: int = 5):
        """Rekomendacje dla pojedynczego tytułu (endpoint GET /api/recommendations/)."""
        if not self.is_ready:
            raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

        try:
            idx = self.movies[
                self.movies["title"].str.contains(target_title, case=False, na=False, regex=False)
            ].index[0]
            target_movie_id = str(self.movies["movieId"].iloc[idx])
        except IndexError:
            return None

        # 1. Pobieramy wektor bazowego filmu bezpośrednio z Pinecone (nie zużywa API OpenAI)
        fetch_res = self.pinecone_index.fetch(ids=[target_movie_id])
        if target_movie_id not in fetch_res.vectors:
            logger.warning("Nie znaleziono wektora dla tego filmu w Pinecone.")
            return None
            
        target_vector = fetch_res.vectors[target_movie_id].values

        # 2. Szukamy 50 najbardziej podobnych filmów wg Pinecone
        query_res = self.pinecone_index.query(vector=target_vector, top_k=50, include_metadata=False)

        # 3. Mieszamy wyniki z Collaborative Filtering
        hybrid_results = []
        cf_scores = self.cosine_sim_cf[idx] 

        for match in query_res.matches:
            rec_movie_id = int(match.id)
            if rec_movie_id == int(target_movie_id):
                continue 

            rec_idx_rows = self.movies[self.movies["movieId"] == rec_movie_id]
            if rec_idx_rows.empty:
                continue
            rec_idx = rec_idx_rows.index[0]

            cb_score = match.score 
            cf_score = cf_scores[rec_idx] 
            
            hybrid_score = alpha * cb_score + (1 - alpha) * cf_score
            hybrid_results.append((rec_idx, hybrid_score, cb_score, cf_score))

        # Sortujemy po wyniku hybrydowym i wybieramy top_n
        hybrid_results.sort(key=lambda x: x[1], reverse=True)
        top_movies = hybrid_results[:top_n]

        results = []
        for rec_idx, hybrid_score, cb_score, cf_score in top_movies:
            mock_cb = np.zeros(len(self.movies))
            mock_cf = np.zeros(len(self.movies))
            mock_cb[rec_idx] = cb_score
            mock_cf[rec_idx] = cf_score
            
            results.append(self._build_result(rec_idx, hybrid_score, idx, mock_cb, mock_cf, alpha))

        return results

    def get_recommendations_for_user(
        self, liked_movie_ids: list[int], alpha: float = 0.5, top_n: int = 10
    ):
        """Rekomendacje dla użytkownika na podstawie listy polubionych filmów (Pinecone + CF)."""
        if not self.is_ready:
            raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

        liked_indices = []
        liked_tmdb_ids = []
        for movie_id in liked_movie_ids:
            rows = self.movies[self.movies["movieId"] == movie_id]
            if not rows.empty:
                liked_indices.append(rows.index[0])
                liked_tmdb_ids.append(str(movie_id)) 

        if not liked_indices:
            return None

        # 1. Pobieramy wektory polubionych filmów z Pinecone
        fetch_res = self.pinecone_index.fetch(ids=liked_tmdb_ids)
        valid_vectors = [fetch_res.vectors[vid].values for vid in liked_tmdb_ids if vid in fetch_res.vectors]
        
        if not valid_vectors:
            logger.warning("Nie znaleziono wektorów w Pinecone dla żadnego z polubionych filmów.")
            return None

        # 2. Uśredniamy wektory polubionych filmów (tworzymy "profil" użytkownika)
        avg_vector = np.mean(valid_vectors, axis=0).tolist()

        # 3. Szukamy 100 najbardziej podobnych filmów do profilu użytkownika
        query_res = self.pinecone_index.query(vector=avg_vector, top_k=100, include_metadata=False)

        # 4. Agregujemy statystyki z Collaborative Filtering
        cf_agg = np.zeros(len(self.movies))
        for idx in liked_indices:
            cf_agg += self.cosine_sim_cf[idx]
        cf_agg /= len(liked_indices)

        # 5. Mieszamy wyniki Pinecone z Collaborative Filtering
        hybrid_results = []
        for match in query_res.matches:
            rec_movie_id = int(match.id)
            if rec_movie_id in liked_movie_ids:
                continue 

            rec_idx_rows = self.movies[self.movies["movieId"] == rec_movie_id]
            if rec_idx_rows.empty:
                continue
            rec_idx = rec_idx_rows.index[0]

            cb_score = match.score 
            cf_score = cf_agg[rec_idx] 
            
            hybrid_score = alpha * cb_score + (1 - alpha) * cf_score
            hybrid_results.append((rec_idx, hybrid_score, cb_score, cf_score))

        hybrid_results.sort(key=lambda x: x[1], reverse=True)
        top_movies = hybrid_results[:top_n]

        base_idx = liked_indices[0] 
        results = []
        
        for rec_idx, hybrid_score, cb_score, cf_score in top_movies:
            mock_cb = np.zeros(len(self.movies))
            mock_cf = np.zeros(len(self.movies))
            mock_cb[rec_idx] = cb_score
            mock_cf[rec_idx] = cf_score
            
            results.append(self._build_result(rec_idx, hybrid_score, base_idx, mock_cb, mock_cf, alpha))

        return results

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

        # Bezpośrednie przekazanie scores bez odpytywania self.cosine_sim_cb
        explanation = self._get_shap_explanation(base_idx, rec_idx, cb_scores[rec_idx], cf_scores[rec_idx])

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
            logger.error(f"Błąd TMDB: {e}")
        return DEFAULT_POSTER_URL


recommender = HybridRecommender()