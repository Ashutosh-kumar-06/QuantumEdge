// Import 'StrictMode' from the 'react' library — StrictMode is a special wrapper
// that helps developers catch common bugs early by running extra checks during development.
import { StrictMode } from 'react'

// Import 'createRoot' from 'react-dom/client' — this function is used to create
// the root of the React application and attach it to a real HTML element on the page.
import { createRoot } from 'react-dom/client'

// Import the global CSS stylesheet ('index.css') so that all base styles
// (like resets, fonts, and background colors) are applied across the entire app.
import './index.css'

// Import the main 'App' component — this is the top-level React component
// that contains all the pages and navigation logic for the application.
import App from './App.tsx'

// Import 'BrowserRouter' from 'react-router-dom' — BrowserRouter enables
// client-side routing, which lets the app show different pages (like Dashboard,
// Tutorial, Lab) without reloading the entire browser page.
import { BrowserRouter } from 'react-router-dom'

// Find the HTML element with the id 'root' in the index.html file.
// The '!' tells TypeScript "I'm sure this element exists, it won't be null."
// Then create a React root attached to that element and render (display) the app inside it.
createRoot(document.getElementById('root')!).render(
  // StrictMode wraps the entire app to enable extra development-time warnings and checks.
  <StrictMode>
    {/* BrowserRouter wraps the app so that React Router can manage page navigation */}
    <BrowserRouter>
      {/* App is the main component — everything in the application lives inside this */}
      <App />
    {/* Closing tag for BrowserRouter */}
    </BrowserRouter>
  {/* Closing tag for StrictMode */}
  </StrictMode>,
)
