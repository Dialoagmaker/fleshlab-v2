import React from 'react';
import approvedLogo from './assets/brand/fleshlab-amateur-wins-approved.png';

export default function FleshLabLogo({ className = '', alt = 'FLESHLAB — Amateur Wins.' }) {
  return (
    <img
      className={`flesh-logo-asset ${className}`.trim()}
      src={approvedLogo}
      alt={alt}
      width="1024"
      height="683"
      decoding="async"
      draggable="false"
    />
  );
}
