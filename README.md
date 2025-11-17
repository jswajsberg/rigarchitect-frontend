# RigArchitect Frontend

A React + Vite frontend for building and managing custom PC configurations.

## What it does

- Interactive PC builder with component compatibility checking
- Guest mode for anonymous users with persistent build storage
- Component catalog with search, filtering, and detailed specifications
- Modal-based authentication with guest-to-user data migration
- Filter persistence across tab switching and page refreshes
- Professional card-based UI with overlay details
- Shopping cart system for builds
- Budget tracking

## Tech Stack

- React 18+ with Vite
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- Axios
- React Query (`@tanstack/react-query`)
- Orval (OpenAPI client generation)

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup

### Installation

Clone the repository:
```bash
git clone <your-repo-url>
cd rigarchitect-frontend
```

Install dependencies:
```bash
npm install
```

### Configuration

Create a `.env` file in the project root:
```env
VITE_API_BASE_URL=http://localhost:8080
```

### API Client Generation (Optional)

If you need to regenerate API clients from the OpenAPI spec:

1. Configure `orval.config.js` with the location of your OpenAPI spec
2. Run:
   ```bash
   npm run generate:api
   ```

Generated API files will appear in `src/api/`.

### Running

```bash
npm run dev
```

The app starts at `http://localhost:5173`

---

## Architecture

### Context-based State Management

- `AuthContext` - User authentication, guest sessions, and data migration
- `ComponentCatalogContext` - Persistent filter state with localStorage integration
- `NavigationContext` - Tab navigation with persistent active tab state
- `CartContext` - Shopping cart management
- `BuilderContext` - PC build state management

### Guest User Experience

- Guest sessions are stored in the backend database with UUID-based session IDs
- Guest builds persist across browser sessions using backend storage
- Seamless migration from guest to authenticated user with data preservation
- 30-day session expiration with automatic cleanup

## Development

Run type checking:
```bash
npm run typecheck
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

---

## Project Structure

```
src/
├── api/           - Generated API clients and controllers
├── components/    - Reusable React components
├── context/       - React Context providers
├── modals/        - Modal components
├── pages/         - Page components
└── main.tsx       - Application entry point
```
