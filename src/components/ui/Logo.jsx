import React from 'react';

export function Logo({ className = "w-8 h-8" }) {
  return (
    <img 
      src="./slate-favicon.svg" 
      alt="Slate Logo" 
      className={className} 
    />
  );
}
