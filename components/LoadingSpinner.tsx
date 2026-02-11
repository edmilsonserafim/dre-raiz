import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando...',
  size = 48
}) => {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <div className="text-center">
        <Loader2
          className="animate-spin mx-auto mb-4 text-[#1B75BB]"
          size={size}
        />
        <h2 className="text-xl font-bold text-gray-900">{message}</h2>
        <p className="text-sm text-gray-500 mt-2">Aguarde um momento</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
