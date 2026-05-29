# Generate FastAPI Code Procedure

Use this skill whenever you are asked to create a new endpoint, feature, or domain in the backend. This playbook ensures strict separation between routers, services, and Pydantic models.

## Step-by-Step Instructions

1. **Step 1: Define Pydantic Models**
   - Identify all request bodies and response shapes needed for the feature.
   - Define them as `BaseModel` subclasses at the top of the relevant router file (or in a shared `models.py` if reused across routers).
   - Every field must be typed. Use `str | None = None` for optional fields.
   - *Example:* A `MovieListItem` response model and a `MoviesPageResponse` wrapper with pagination fields.

2. **Step 2: Implement the Service (`services/`)**
   - Create or update a `services/<domain>_service.py` file.
   - All business logic, external HTTP calls, and data transformations go here.
   - Use `async def` for all methods that perform I/O.
   - Use `httpx.AsyncClient` for any outbound HTTP requests — never `requests`.
   - Import paths and config values from `constants.py`.
   - *Example:* `services/movies_service.py` containing `async def list_movies(page, page_size, query)`.

3. **Step 3: Create or Update the Router (`routers/`)**
   - Create or update `routers/<domain>.py`.
   - Register the router with `APIRouter(prefix="/api/<domain>", tags=["<Domain>"])`.
   - Each endpoint function must:
     - Be `async def`.
     - Declare `user: dict = Depends(get_current_user)` if authentication is required.
     - Declare query/path params using `Query()` or `Path()` with validation constraints (e.g., `ge=1`, `min_length=1`).
     - Set `response_model=` to the appropriate Pydantic model.
     - Contain no business logic — only call the service.
   - *Example:* `@router.get("/", response_model=MoviesPageResponse)`.

4. **Step 4: Register the Router in `main.py`**
   - Import the new router and add `app.include_router(router)`.

## Example Output Structure

If asked to build a `ratings` feature, generate/edit:
1. Pydantic models `RatingItem`, `RatingCreateRequest` in `routers/ratings.py`
2. `services/ratings_service.py` with `async def get_ratings(...)` and `async def create_rating(...)`
3. `routers/ratings.py` with `@router.get(...)` and `@router.post(...)`
4. Registration in `main.py`

## Prioritization & Summary

1. **Critical (must follow):**
   - Routers contain no business logic — delegate everything to services.
   - All endpoint functions and service methods performing I/O are `async def`.
   - All responses are typed with Pydantic models and declared via `response_model=`.

2. **High (follow unless project-specific reasons):**
   - Use `Depends(get_current_user)` on all endpoints that require authentication.
   - Validate query parameters with `Query()` constraints.
   - Load all config and paths from `constants.py`.

3. **Recommended (nice-to-have):**
   - Add logging in services for key operations and errors.
   - Raise `HTTPException(status_code=404)` when a requested resource is not found.

## Quick Checklist

- [ ] Pydantic models defined for request and response
- [ ] Service method is `async def` and contains all logic
- [ ] Router endpoint is `async def` with `response_model=` and `Depends()`
- [ ] Router registered in `main.py`
- [ ] No blocking I/O (no `requests`, no `open()` without async)
