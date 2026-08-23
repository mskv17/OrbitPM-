import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const query = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: false,
    }
  }
});

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <QueryClientProvider client={query}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
)
