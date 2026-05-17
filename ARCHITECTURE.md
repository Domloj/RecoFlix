# Recoflix Project Architecture

## 1. Project Description
RecoFlix is an intelligent movie recommendation web application featuring an Explainable AI (XAI) module. The system combines a React-based frontend with a FastAPI backend. It utilizes a Hybrid Recommendation Engine (Collaborative Filtering + Content-Based) to generate personalized suggestions and mathematically calculate the reasoning behind them (XAI). OpenAI language models are used to enhance chatbot interactions (Retrieval-Augmented Generation approach), and Firebase Authentication handles user management.

## 2. Tech Stack
- **Frontend:** React 18 (Vite), Mantine UI, React Router DOM, Firebase Client SDK.
- **Backend:** FastAPI, AsyncOpenAI, python-dotenv, Firebase Admin SDK.
- **Machine Learning & Data:** Pandas, Scikit-learn (TF-IDF, Cosine Similarity), Jupyter Notebook (for ML experiments and model evaluation).
- **External APIs:** 
  - TMDB API (fetching movie posters dynamically).
  - OpenAI API (LLM for conversational recommendations).
- **Database:** MovieLens 100k dataset (`movies.csv`, `ratings.csv`, `links.csv`). Firebase Auth for users.

## 3. Folder Structure (Overview)
- `/backend` - Server logic, FastAPI endpoints, AI routers, and Recommender Engine (`recommender_engine.py`).
- `/data` - Stores datasets (MovieLens 100k CSV files).
- `/frontend` - React client application, strictly separated into `/components`, `/interfaces`, and `/services` with isolated `.css` files.
- `/notebooks` - Jupyter Notebooks for safe ML experimentation (Embeddings, SHAP, RMSE evaluation) before moving to production.
- `.github` - Contains Copilot configuration (`/agents`, `/skills`) to enforce architectural rules.
- `ARCHITECTURE.md` - Project architecture documentation.

## 4. Current Action Plan / Milestones
- [x] **Step 1: Baseline Engine:** Implementation of a basic memory-based Hybrid Recommender (TF-IDF Genres + Item-Item CF) with an XAI percentage breakdown and TMDB poster integration.
- [ ] **Step 2: Walking Skeleton (Frontend):** Building the React frontend (Dashboard) to fetch recommendations and visualize the XAI data using progress bars and dynamically fetched posters.
- [ ] **Step 3: ML Experiments (Sandbox):** Experimenting in Jupyter Notebooks to replace TF-IDF with LLM text Embeddings and implementing advanced SHAP values for deeper XAI.
- [ ] **Step 4: Advanced Engine Integration:** Swapping the baseline backend engine with the advanced Embedding + SHAP model without breaking the frontend API contract.
- [ ] **Step 5: RAG Chatbot Integration:** Connecting the recommender engine as a "Retrieval" pre-filter to drastically reduce LLM context tokens and improve chatbot accuracy.