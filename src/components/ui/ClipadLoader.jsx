import React from 'react';

export default function ClipadLoader({ text = "Loading...", fullScreen = false }) {
  const LoaderContent = (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-16 h-16 relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/5" />
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <svg className="w-6 h-6 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      {text && <p className="mt-6 text-sm text-slate-500 font-medium tracking-wide animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-white dark:bg-[#090E17]">
        {LoaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 w-full h-full min-h-[200px]">
      {LoaderContent}
    </div>
  );
}
