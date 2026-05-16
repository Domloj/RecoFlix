import json

def parse_movielens_items(file_path):
    movies = []
    
    # z pliku u.genre
    genres_list = [
        "Unknown", "Action", "Adventure", "Animation", "Children's", 
        "Comedy", "Crime", "Documentary", "Drama", "Fantasy", 
        "Film-Noir", "Horror", "Musical", "Mystery", "Romance", 
        "Sci-Fi", "Thriller", "War", "Western"
    ]
    
    with open(file_path, 'r', encoding='latin-1') as file:
        for line in file:
            parts = line.strip().split('|')
            if len(parts) < 24:
                continue
                
            movie_id = parts[0]
            title = parts[1]
            release_date = parts[2]
            
            genre_flags = parts[5:]
            movie_genres = [
                genres_list[i] for i, flag in enumerate(genre_flags) if flag == '1'
            ]
            
            movies.append({
                "id": int(movie_id),
                "title": title,
                "release_date": release_date,
                "genres": movie_genres
            })

    return movies

movies_data = parse_movielens_items('./ml-100k/u.item')

with open('movies_database.json', 'w', encoding='utf-8') as f:
    json.dump(movies_data, f, ensure_ascii=False, indent=2)

print(f"Sukces! Wyodrębniono {len(movies_data)} filmów.")