import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import axios from "axios";
import { authService } from "./services/AuthService";

axios.defaults.baseURL = "http://localhost:8080";

// Setup JWT token interceptors
authService.setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
