import React from 'react';

interface SafariFallbackProps {
  children: React.ReactNode;
}

export const SafariFallback: React.FC<SafariFallbackProps> = ({ children }) => {
  return <>{children}</>;
}; 