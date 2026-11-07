import React from 'react';
import JCL_LOGO_BASE64 from '@/assets/jclLogoBase64';

export function Logo({ className = "w-8 h-8", hideText = false }) {
  return (
    <img 
      src={JCL_LOGO_BASE64} 
      alt="JCL Office" 
      className={`${className} object-contain rounded-md`} 
    />
  );
}
export default Logo;
