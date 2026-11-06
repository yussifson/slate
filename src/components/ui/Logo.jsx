import React from 'react';

export function Logo({ className = "w-8 h-8", hideText = false }) {
  return (
    <img 
      src="/jcl-logo.png" 
      alt="JCL Real Estate" 
      className={`${className} object-contain rounded-md`} 
    />
  );
}
export default Logo;
