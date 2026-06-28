import React from 'react';
import logo from '../../assets/aqua.png';

const Logo = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <img 
      src={logo} 
      alt="Logo Plongée Club" 
      className={`object-contain ${sizes[size]} ${className}`}
    />
  );
};

export default Logo;