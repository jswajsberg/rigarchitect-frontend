# RigArchitect Frontend

React + Vite frontend for creating and managing custom PC builds. Features user authentication, real-time API integration, and a responsive Tailwind CSS interface.

## Features

- Connects to the RigArchitect Spring Boot backend API
- Axios and Orval-generated API clients for type-safe API calls
- React Query for asynchronous data fetching and caching
- Tailwind CSS for modern, responsive styling
- Lucide React icons for consistent, lightweight SVG icons
- Environment-based API URL configuration
- React Query Devtools for debugging

## Tech Stack

- React 18+ with Vite
- TypeScript
- Tailwind CSS
- Lucide React (icon library)
- Axios
- React Query (`@tanstack/react-query`, `@tanstack/react-query-devtools`)
- Orval (for OpenAPI client generation)
- Node.js 18+, npm 9+

## Getting Started

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd rigarchitect-frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### API Client Generation (Optional)

If you are using Orval to generate API clients from your OpenAPI spec:

1. Configure `orval.config.js` with the location of your OpenAPI spec.
2. Run:

   ```bash
   npm run generate:api
   ```

Generated API files will appear in `src/api/generated/`.

### Environment Variables

Create a `.env` file in the project root:

```
VITE_API_BASE_URL=http://localhost:8080
```

Use it in code:

```ts
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
```

### License

[MIT](LICENSE)
