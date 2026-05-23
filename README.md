# TranslateSafe

TranslateSafe is a powerful, AI-driven translation application built with React, Express, and Google's Gemini API. It bridges the gap between simple translation tools and language learning by integrating a robust flashcard system.

## Features

-   **AI Translation**: Utilizes Google's Gemini models (`gemini-3-flash-preview`) for high-quality, context-aware translations.
-   **Multi-modal Input**:
    -   **Text**: Type or paste text.
    -   **Voice**: Speech-to-text integration for hands-free input.
    -   **Image**: Upload images to extract and translate text automatically.
-   **Flashcard System**:
    -   Save any translation as a flashcard.
    -   Study mode with flip animations.
    -   Persisted storage using SQLite.
-   **Full-Stack Architecture**: Built with a custom Express server integrating Vite for a seamless development and production experience.

## Tech Stack

-   **Frontend**: React 19, Tailwind CSS, Lucide Icons, Vite.
-   **Backend**: Node.js, Express.
-   **Database**: SQLite (local file-based database).
-   **AI**: Google GenAI SDK (`@google/genai`).
-   **Language**: TypeScript.

## Setup & Installation

1.  **Prerequisites**: Node.js v20+ installed.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
    *Note: DB configuration is handled automatically via SQLite.*

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    This starts the Express server on port 3000.

## Project Structure

-   `/server.ts`: Application entry point. Configures Express and Vite middleware.
-   `/server/`: Backend logic.
    -   `db.ts`: SQLite connection setup.
    -   `initDb.ts`: Database schema initialization.
    -   `routes/`: API route definitions.
-   `/src/` (Root): Frontend source code.
    -   `App.tsx`: Main application controller.
    -   `components/`: UI components (`TranslationView`, `FlashcardsView`).
    -   `services/`: External service integrations (`geminiService.ts`).

## API Endpoints

### Flashcards (`/api/flashcards`)

-   `GET /`: Retrieve all saved flashcards.
-   `POST /`: Create a new flashcard.
    -   Body: `{ original, translated, sourceLang, targetLang, timestamp, id }`
-   `DELETE /:id`: Delete a specific flashcard.

## Gemini Integration

The application uses the `@google/genai` SDK to interact with Gemini models.
-   **Text Translation**: Uses structured prompting to return JSON objects containing the translation and detected language.
-   **Image Translation**: Sends base64 encoded image data to Gemini for OCR and translation in a single pass.
