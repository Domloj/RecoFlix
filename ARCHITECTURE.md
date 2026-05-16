# Recoflix Project Architecture

## 1. Project Description
RecoFlix is a movie recommendation web application that combines a user interface built with React with a FastAPI backend. The system utilizes Firebase Authentication for user management and OpenAI language models to generate personalized movie recommendations.

## 2. Tech Stack
- **Frontend:** React 18 (using Vite), Mantine (UI library), React Router DOM, Firebase Client SDK.
- **Backend:** FastAPI, AsyncOpenAI (for communication with OpenAI language models), python-dotenv, Firebase Admin SDK.
- **Database:** No traditional database for movies (static data loaded from the `movies_database.json` file). Firebase Authentication for user account management.

## 3. Folder Structure (Overview)
- `/.github` - GitHub Actions configurations for CI/CD.
- `/backend` - Server logic, FastAPI API, services, and modules for interacting with LLMs.
- `/data` - Stores static data, such as the movie database (`movies_database.json`).
- `/frontend` - React client application, components, pages, and UI logic.
- `.gitignore` - Git ignore file.
- `ARCHITECTURE.md` - Project architecture documentation.
- `CONVENTIONS.md` - GIT and GitHub conventions for the project.
- `README.md` - Main project README file.

## 4. Main Assumptions and Data Flow
1.  **Authentication:** The user logs in or registers through the React interface. The frontend uses the Firebase Client SDK for authentication, receiving an ID token.
2.  **Frontend-Backend Communication:** The client application (React) communicates with the FastAPI API via HTTP requests (e.g., POST to `/api/chat`).
3.  **API Authorization:** Every protected request to the backend includes the Firebase ID token in the authorization header. The backend, using `dependencies.py` and the Firebase Admin SDK, verifies the token's validity and identifies the user.
4.  **Recommendation Generation:** After authorization, the user's request (along with the conversation history) is passed to `llm_service.py`. This service sends a query to the OpenAI language model, using the static movie database (`movies_database.json`) for context.
5.  **AI Response:** The language model generates a movie recommendation, which is returned by the backend to the frontend and displayed in the chat widget.

## 5. Current Action Plan / Milestones
- [x] Step 1: Agent initialization and configuration (IN PROGRESS)
- [ ] Step 2: Implementation of the AI-based movie recommendation system with Firebase integration.
- [ ] Step 3: Adding conversation history and user preference functionality to the chatbot for more personalized recommendations.