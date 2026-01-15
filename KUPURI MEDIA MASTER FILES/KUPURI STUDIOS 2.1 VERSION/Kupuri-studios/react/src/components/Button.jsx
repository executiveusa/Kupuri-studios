import React from 'react';

function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-dark focus:ring-accent/50 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500/50',
    ghost: 'text-gray-200 hover:text-white hover:bg-gray-800 focus:ring-gray-600/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
