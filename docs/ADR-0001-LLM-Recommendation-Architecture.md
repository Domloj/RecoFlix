# ADR 0001: LLM Recommendation Engine Architecture

## Status
Accepted

## Context
The RecoFlix AI assistant needs to recommend real, existing movies based on user natural language queries. To prevent the LLM from hallucinating non-existent movies, we must provide our movie database as context. We evaluated three architectural approaches to handle injecting this context into the LLM prompt.

## Evaluated Approaches

### 1. Random Sampling (Initial Baseline)
**Logic:** Randomly select a hardcoded number (e.g., 50) of movies from the database and pass them as JSON context to the LLM.
* **Pros:** Zero local computational overhead, extremely fast execution, low token usage.
* **Cons:** Purely luck-based relevance. If a user asks for "alien invasion movies", there is a high probability that the 50 randomly sampled movies contain zero sci-fi films, leading to poor or fallback LLM responses.

### 2. Full Database via Prompt Caching
**Logic:** Send the entire dataset (10,000+ movies) inside the system prompt and rely on OpenAI's Prompt Caching (which retains static prefixes for up to 24 hours) to reduce costs and latency on subsequent requests.
* **Pros:** The LLM technically has the entire catalog available and can theoretically fulfill any niche request.
* **Cons:**
  * **"Lost in the Middle" Syndrome:** LLMs perform poorly at information retrieval when the context is overwhelmingly large; it struggles to consistently pick the *best* 3 films out of 10,000 in a single pass.
  * **Unpredictable Costs:** If the cache expires or gets evicted, the next request will have to process millions of tokens at full price.
  * **Scalability:** Hard limits on context windows make this impossible as the database grows.

### 3. Retrieval-Augmented Generation / RAG (Chosen Approach)
**Logic:** 
1. **Offline Indexing:** Generate vector embeddings (using `text-embedding-3-small`) for all movies (combining title, genre, and description) and save them as a local `numpy` array.
2. **Online Querying:** When a user submits a prompt, generate an embedding for their specific query + user history.
3. **Similarity Search:** Calculate cosine similarity (`np.dot` since vectors are normalized) between the query vector and all movie vectors in RAM.
4. **LLM Generation:** Take the Top 50 most semantically similar movies and inject only those into the LLM context.
* **Pros:**
  * Ensures the LLM only receives highly relevant candidates, drastically improving the recommendation quality.
  * Keeps the LLM context window small, minimizing token costs and latency.
  * Highly scalable; local vector math via `numpy` for 10,000 records takes fractions of a millisecond.
* **Cons:**
  * Requires an additional sequential API call to embed the user's prompt (adds ~100-200ms of latency).
  * Introduces the need for an offline caching/sync step (generating `.npy` files) whenever the database updates.

## Decision
We chose **Approach 3 (RAG)**. It perfectly bridges the gap between cost efficiency and high-quality recommendations. A generic Architecture Decision Record (ADR) format is used to document this choice.
