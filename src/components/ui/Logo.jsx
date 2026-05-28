import React from 'react';

export function Logo({ className = "w-8 h-8" }) {
  return (
    <img 
      src="/optalflow-favicon.svg" 
      alt="OptalFlow Logo" 
      className={className} 
    />
  );
}
