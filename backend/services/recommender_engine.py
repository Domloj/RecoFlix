import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging
import os
import requests

from constants import (
    DEFAULT_POSTER_URL,
    LINKS_CSV_PATH,
    MOVIES_CSV_PATH,
    RATINGS_CSV_PATH,
    TMDB_BASE_URL,
    TMDB_IMAGE_BASE_URL,
)

logging.basicConfig(level=logging.INFO)

class HybridRecommender:
    def __init__(self):
        self.movies = None
        self.links = None
        self.cosine_sim_cb = None
        self.cosine_sim_cf = None
        self.is_ready = False
        self.tmdb_api_key = os.getenv("TMDB_API_KEY")

    def initialize(self):
        logging.info("Rozpoczynam inicjalizację macierzy (Pre-computing)...")

        self.movies = pd.read_csv(MOVIES_CSV_PATH)
        ratings = pd.read_csv(RATINGS_CSV_PATH)
        self.links = pd.read_csv(LINKS_CSV_PATH)

        # Macierz Content-Based
        tfidf = TfidfVectorizer(token_pattern=r'[a-zA-Z0-9\-]+')
        tfidf_matrix = tfidf.fit_transform(self.movies['genres'].fillna(''))
        self.cosine_sim_cb = cosine_similarity(tfidf_matrix, tfidf_matrix)

        # Macierz Collaborative Filtering
        user_item_matrix = ratings.pivot(index='movieId', columns='userId', values='rating').fillna(0)
        user_item_matrix = user_item_matrix.reindex(self.movies['movieId'], fill_value=0)
        self.cosine_sim_cf = cosine_similarity(user_item_matrix)

        self.is_ready = True
        logging.info("Silnik rekomendacji hybrydowych gotowy do pracy!")

    def _fetch_poster_url(self, tmdb_id: float) -> str:
        """Pobiera oficjalny adres URL plakatu z bazy TMDB."""
        default_poster = DEFAULT_POSTER_URL

        if pd.isna(tmdb_id) or not self.tmdb_api_key:
            return default_poster
            
        url = f"{TMDB_BASE_URL}/{int(tmdb_id)}?api_key={self.tmdb_api_key}"
        try:
            # Wysyłamy zapytanie do TMDB
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                poster_path = data.get("poster_path")
                if poster_path:
                    return f"{TMDB_IMAGE_BASE_URL}{poster_path}"
        except Exception as e:
            logging.error(f"Błąd podczas pobierania plakatu z TMDB: {e}")
            
        return default_poster

    def get_recommendations(self, target_title: str, alpha: float = 0.5, top_n: int = 5):
        if not self.is_ready:
            raise ValueError("Silnik nie został jeszcze zainicjalizowany.")

        try:
            idx = self.movies[self.movies['title'].str.contains(target_title, case=False, na=False)].index[0]
        except IndexError:
            return None 
            
        base_movie_title = self.movies['title'].iloc[idx]
        
        cb_scores = self.cosine_sim_cb[idx]
        cf_scores = self.cosine_sim_cf[idx]
        hybrid_scores = alpha * cb_scores + (1 - alpha) * cf_scores
        
        sim_scores = sorted(list(enumerate(hybrid_scores)), key=lambda x: x[1], reverse=True)
        top_movies = sim_scores[1:top_n+1]
        
        results = []
        for i, score in top_movies:
            contrib_cb = alpha * cb_scores[i]
            contrib_cf = (1 - alpha) * cf_scores[i]
            total_contrib = contrib_cb + contrib_cf
            
            pct_cb = (contrib_cb / total_contrib * 100) if total_contrib > 0 else 0
            pct_cf = (contrib_cf / total_contrib * 100) if total_contrib > 0 else 0

            if pct_cb > 60:
                explanation = f"Film polecany głównie dlatego, że idealnie pokrywa się z klimatem '{base_movie_title}'."
            elif pct_cf > 60:
                explanation = f"Ten tytuł to hit społeczności. Widzowie oceniający wysoko '{base_movie_title}' masowo go oglądają."
            else:
                explanation = f"Zrównoważony wybór. Świetnie pasuje do '{base_movie_title}' i cieszy się uznaniem wśród podobnych do Ciebie widzów."

            movie_id = self.movies['movieId'].iloc[i]
            tmdb_id_row = self.links[self.links['movieId'] == movie_id]
            tmdb_id = tmdb_id_row['tmdbId'].values[0] if not tmdb_id_row.empty else None
            
            poster_url = self._fetch_poster_url(tmdb_id)

            results.append({
                "movie_id": int(movie_id),
                "title": str(self.movies['title'].iloc[i]),
                "poster_url": poster_url, 
                "score": float(score),
                "xai": {
                    "content_contribution_pct": float(pct_cb),
                    "collaborative_contribution_pct": float(pct_cf),
                    "human_explanation": explanation
                }
            })
        return results

recommender = HybridRecommender()