import csv
import json
import re

def convert_movielens_csv_to_json(csv_file_path, json_file_path):
    movies = []
    
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        
        for row in reader:
            movie_id = int(row['movieId'])
            raw_title = row['title']
            
            year_match = re.search(r'\((\d{4})\)\s*$', raw_title)
            release_year = year_match.group(1) if year_match else "Unknown"
            
            if row['genres'] == '(no genres listed)':
                genres = []
            else:
                genres = row['genres'].split('|')
            
            movies.append({
                "id": movie_id,
                "title": raw_title,
                "release_year": release_year,
                "genres": genres
            })

    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(movies, json_file, ensure_ascii=False, indent=2)
        
    return len(movies)

CSV_PATH = './ml-100k/ml-latest-small/movies.csv'
JSON_PATH = './movies_database.json'

print("Rozpoczynam przetwarzanie pliku CSV...")
movies_count = convert_movielens_csv_to_json(CSV_PATH, JSON_PATH)
print(f"Sukces! Przekonwertowano {movies_count} filmów i zapisano w {JSON_PATH}.")