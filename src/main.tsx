import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);

// Offline support / installable app; new versions are picked up automatically
registerSW({ immediate: true });
