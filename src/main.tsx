// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Quiz from './Quiz.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <Quiz />
  // </StrictMode>
);
