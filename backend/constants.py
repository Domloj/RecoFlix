from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
BASE_DIR = BACKEND_DIR.parent

DATA_DIR = BASE_DIR / "data"
ML_DIR = DATA_DIR / "ml-100k" / "ml-latest-small"

MOVIES_DB_PATH = DATA_DIR / "movies_database.json"
MOVIES_CSV_PATH = ML_DIR / "movies.csv"
RATINGS_CSV_PATH = ML_DIR / "ratings.csv"
LINKS_CSV_PATH = ML_DIR / "links.csv"
TAGS_CSV_PATH = ML_DIR / "tags.csv"
TMDB_CACHE_PATH = DATA_DIR / "tmdb_cache.json"

SERVICE_ACCOUNT_PATH = BACKEND_DIR / "serviceAccountKey.json"

FRONTEND_URL_DEFAULT = "http://localhost:5173"
TMDB_LANGUAGE_DEFAULT = "pl-PL"

DEFAULT_POSTER_URL = "https://via.placeholder.com/500x750/1a1a2e/ffffff?text=Brak+Plakatu"
TMDB_BASE_URL = "https://api.themoviedb.org/3/movie"
TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"
