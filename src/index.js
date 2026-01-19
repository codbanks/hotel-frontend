import React from 'react';
import ReactDOM from 'react-dom/client';

// 1. The Foundation: Variables and Reset
import './styles/theme.css'; 

// 2. The Tailwind imports (if you use them, keep them here, otherwise remove)
import './index.css'; 

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();