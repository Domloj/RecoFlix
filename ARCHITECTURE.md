# Recoflix Project Architecture

## 1. Project Description
RecoFlix is a movie recommendation web application that combines a user interface built with React with a FastAPI backend. The system utilizes Firebase Authentication for user management and OpenAI language models to generate personalized movie recommendations.

## 2. Tech Stack
- **Frontend:** React 18 (Vite), Mantine UI, React Router DOM, Firebase Client SDK.
- **Backend:** FastAPI, AsyncOpenAI, python-dotenv, Firebase Admin SDK.
- **Database:** Static data loaded from `movies_database.json`. Firebase Auth for users.

## 3. Folder Structure (Overview)
- `/backend` - Server logic, FastAPI API, services, and LLM modules.
- `/data` - Stores static data (`movies_database.json`).
- `/frontend` - React client application, components, pages.
- `ARCHITECTURE.md` - Project architecture documentation.
- `CONVENTIONS.md` - GIT and GitHub conventions.

## 4. Current Action Plan / Milestones
- [ ] Step 1: Implementation of the AI-based movie recommendation system with Firebase integration.
- [ ] Step 2: Adding conversation history and user preferences to the chatbot.