import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Map from './Map.jsx';

// StrictMode as in a typical React app (it double-mounts effects only in development builds).
createRoot(document.getElementById('root')).render(<StrictMode><Map /></StrictMode>);
