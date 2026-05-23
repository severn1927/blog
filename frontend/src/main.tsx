import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('[ProjectShare] main.tsx loaded');

try {
    const container = document.getElementById('root');
    if (!container) {
        throw new Error('Root element not found');
    }
    
    console.log('[ProjectShare] Creating React root...');
    const root = ReactDOM.createRoot(container);
    
    console.log('[ProjectShare] Rendering App...');
    root.render(
        React.createElement(React.StrictMode, null,
            React.createElement(App)
        )
    );
    
    console.log('[ProjectShare] Render initiated successfully');
} catch (err) {
    console.error('[ProjectShare] Fatal error:', err);
    document.getElementById('root')!.innerHTML = `
        <div style="padding:40px;font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h1 style="color:#dc2626">Application Error</h1>
            <pre style="background:#fef2f2;padding:16px;border-radius:8px;overflow:auto;color:#991b1b">${err}</pre>
            <p style="margin-top:16px;color:#6b7280">Please check the browser console for details.</p>
        </div>
    `;
}
