import React from 'react';
import { BlockContainerProps } from '../types';

/**
 * BlockContainer - Container compartilhado para todos os blocos
 */
export const BlockContainer: React.FC<BlockContainerProps> = ({
  children,
  title,
  subtitle,
  className = '',
  actions
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div className="flex-1">
            {title && (
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 font-medium mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="ml-4">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
