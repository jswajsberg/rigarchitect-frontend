# RigArchitect Frontend

React + Vite frontend for creating and managing custom PC builds, featuring user authentication, real-time API integration, and a responsive Material UI interface.

## Features

* Connects to the RigArchitect Spring Boot backend API
* Axios and Orval-generated API clients for all endpoints
* React Query for async data fetching and caching
* Material UI components for a modern, responsive UI
* Environment-based API URL configuration

## Getting Started

### Prerequisites

* Node.js 18+
* npm 9+

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

3. (Optional) If using TypeScript, make sure types are installed:

   ```bash
   npm install @types/react @types/react-dom --save-dev
   ```

### Running the Development Server

```bash
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173) to view the app.

### API Client Generation (Optional)

If using Orval to generate API clients from your OpenAPI spec:

1. Configure `orval.config.js` with the location of your OpenAPI spec.
2. Run:

   ```bash
   npm run generate:api
   ```
3. Generated API files will appear in `src/api/generated/`.

### Environment Variables

Create a `.env` file in the project root for backend configuration:

```
VITE_API_BASE_URL=http://localhost:8080
```

Use it in code:

```javascript
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
```

### Dependencies

* React + Vite
* Material UI (`@mui/material`, `@emotion/react`, `@emotion/styled`)
* Axios & React Query (`@tanstack/react-query`, `@tanstack/react-query-devtools`)
* Orval (optional, dev dependency)

### License

[MIT](LICENSE)
