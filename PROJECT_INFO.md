# ShopSathi: Project Information

This document provides a technical overview of the ShopSathi application, including its architecture, technologies, and key implementation details.

---

## 1. Project Overview

ShopSathi is a comprehensive business management suite built as a Single Page Application (SPA). It aims to provide an all-in-one solution for small businesses to manage their operations without relying on multiple, expensive cloud services. The application is designed to be offline-first, private, and highly performant.

---

## 2. Core Technologies

-   **React:** The core UI library for building the component-based user interface.
-   **TypeScript:** Provides static typing for improved code quality, readability, and developer experience.
-   **Tailwind CSS:** A utility-first CSS framework for rapid and consistent UI development.
-   **Recharts:** A composable charting library for building the data visualizations in the Dashboard and Reports sections.
-   **Lucide React:** A beautiful and consistent icon library used throughout the application.
-   **Google Gemini API (`@google/genai`):** Powers all AI-driven features, including the AI Assistant, description enhancement, and AI Actions.
-   **Google Drive API:** Used for the secure, user-authenticated backup and synchronization of application data.
-   **jsPDF & html2canvas:** Used in combination to generate high-quality, printable PDF documents from HTML content.

---

## 3. Project Structure

The codebase is organized into logical directories to maintain separation of concerns:

-   `/components`: Contains reusable React components used across multiple pages (e.g., `StatCard`, `InvoiceForm`, `Sidebar`).
-   `/pages`: Contains top-level components that represent a full "page" or view in the application (e.g., `DashboardPage`, `InvoicesPage`).
-   `/context`: Home to the global state management logic. `DataContext.tsx` uses React's Context API and `useReducer` hook to manage the entire application state.
-   `/hooks`: Contains custom React hooks, such as `useLocalStorage` for data persistence and `useDebounce` for performance optimization.
-   `/services`: Handles communication with external APIs. `geminiService.ts` wraps calls to the Gemini API, and `googleDriveService.ts` handles all interactions with the Google Drive API.
-   `/utils`: A collection of helper functions for tasks like formatting currency, generating document numbers, creating PDF exports, and generating notifications.
-   `types.ts`: A central file defining all TypeScript types and interfaces used throughout the application, ensuring data consistency.
-   `constants.tsx`: Stores application-wide constants, such as the navigation structure (`NAV_GROUPS`).

---

## 4. State Management

The application employs a centralized state management pattern using React's native **Context API** and the **`useReducer` hook**.

-   **`DataContext.tsx`** is the heart of this system.
-   It defines the `initialState` and a comprehensive `dataReducer` function that handles all state mutations via dispatched actions (e.g., `ADD_INVOICE`, `UPDATE_CUSTOMER`).
-   This approach provides predictable state transitions and keeps business logic separate from the UI components.
-   The `useData()` custom hook provides a simple and clean way for any component to access the global state and dispatch actions.

---

## 5. Key Feature Implementation

### Accounting Engine

The accounting system is built on the principles of double-entry bookkeeping.
-   **Automated Journal Entries:** Instead of requiring manual entry for every transaction, the system automatically generates `JournalEntry` objects in response to user actions.
    -   Creating an `Expense` debits an expense account and credits an asset account.
    -   Receiving an `Invoice Payment` debits an asset account (like Cash) and credits Accounts Receivable.
    -   Finalizing a `Purchase Order` debits Inventory and credits Accounts Payable.
-   **Chart of Accounts (`AccountsPage.tsx`):** Users can manage their accounts, but core "System Accounts" are protected to ensure the integrity of the automated system.
-   **Financial Reports:** Reports like the Profit & Loss and Balance Sheet are calculated in real-time by aggregating the balances of the relevant accounts from the Chart of Accounts, which in turn are derived from the journal entries.

### AI Integration (`geminiService.ts`)

The Gemini API is integrated to provide "smart" features that assist the user.
-   **AI Assistant:** Uses the `ai.chats.create` streaming functionality for a conversational experience. The entire application state is passed as context in the initial prompt, allowing the AI to answer questions about the user's specific business data.
-   **AI Actions:** The `generateActionableInsight` function sends a targeted prompt with a specific slice of data (e.g., overdue invoices) to generate helpful suggestions on the dashboard.
-   **Helper Functions:** Smaller AI tasks, like rewriting an item description, are handled by simple `ai.models.generateContent` calls with highly specific, single-task prompts.

### Data Persistence & Backup

-   **Local Storage (`useLocalStorage.ts`):** The entire application state (`AppState`) is serialized to JSON and saved in the browser's Local Storage on every change. This provides offline capability and data persistence between sessions.
-   **Google Drive Backup (`googleDriveService.ts`):**
    -   Uses the Google API Client Library to handle OAuth 2.0 authentication securely.
    -   When a backup is triggered, the service authenticates the user and then uses the Drive API (`drive.files`) to create or update a single `shopsathi_backup.json` file.
    -   Crucially, it uses the `appDataFolder` scope, which means the application can **only access the files it creates**, ensuring user privacy and security. It cannot see any other files in the user's Drive.
