import React, { useRef, useEffect, useState} from 'react';

/**
 * Renders arbitrary code in a highly secure, isolated iframe.
 * Prevents XSS, window access, and parent DOM manipulation.
 */
export default function SecureSandbox({ code, initialData = {}}) {
 const iframeRef = useRef(null);
 const [error, setError] = useState(null);

 // We construct a secure HTML wrapper that injects Babel (standalone) 
 // to compile the React code on the fly securely inside the sandbox.
 const srcDoc = `
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <style>
 body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 1rem;}
 .error { color: #ef4444; background: #fee2e2; padding: 1rem; border-radius: 0.5rem; font-family: monospace; white-space: pre-wrap;}
 </style>
 <!-- Load React and ReactDOM from CDN -->
 <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
 <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
 <!-- Load Babel for on-the-fly JSX compilation -->
 <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
 <!-- Load Tailwind for styling -->
 <script src="https://cdn.tailwindcss.com"></script>
 </head>
 <body>
 <div id="root"></div>
 <script type="text/babel">
 try {
 const initialData = ${JSON.stringify(initialData)};
 
 // The raw code injected by OrbitBolt
 const rawCode = \`${code}\`;
 
 if (!rawCode || rawCode.trim() === '') {
 document.getElementById('root').innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;color:#6b7280;font-family:sans-serif;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;margin-bottom:1rem;"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg><h2 style="font-size:1.25rem;font-weight:600;color:#374151;margin-bottom:0.5rem;">Custom Code WorkSlate</h2><p>No React code was generated for this sandbox. Ask the AI to write a CustomSlate component!</p></div>';
} else {
 ${code}
 if (typeof CustomModule !== 'undefined') {
 const root = ReactDOM.createRoot(document.getElementById('root'));
 root.render(<CustomModule data={initialData} />);
} else {
 document.getElementById('root').innerHTML = '<div class="error">Error: Custom React code was generated, but it did not define a component named CustomSlate.</div>';
}
}
} catch (err) {
 document.getElementById('root').innerHTML = '<div class="error">' + err.toString() + '</div>';
 window.parent.postMessage({ type: 'SANDBOX_ERROR', message: err.toString()}, '*');
}
 </script>
 </body>
 </html>
 `;

 useEffect(() => {
 const handleMessage = (event) => {
 // In a real app, verify origin or check event.source
 if (event.data?.type === 'SANDBOX_ERROR') {
 setError(event.data.message);
}
};
 window.addEventListener('message', handleMessage);
 return () => window.removeEventListener('message', handleMessage);
}, []);

 return (
 <div className="w-full h-full min-h-[400px] rounded-xl border border-border bg-muted/30 overflow-hidden relative ring-1 ring-border/50 ">
 {error && (
 <div className="absolute top-0 left-0 right-0 p-3 bg-destructive/10 text-destructive text-xs font-mono z-10 break-all border-b border-destructive/20">
 Sandbox Error: {error}
 </div>
 )}
 <iframe
 ref={iframeRef}
 title="orbit-secure-sandbox"
 srcDoc={srcDoc}
 sandbox="allow-scripts" // Notice we DO NOT allow-same-origin. This ensures complete isolation.
 className="w-full h-full min-h-[400px] border-none bg-background"
 />
 </div>
 );
}
