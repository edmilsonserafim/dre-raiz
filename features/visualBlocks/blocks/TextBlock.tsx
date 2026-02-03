import React from 'react';
import { TextBlockProps } from '../types';
import { BlockContainer } from './BlockContainer';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * TextBlock - Bloco de texto com suporte a markdown e variantes
 */
export const TextBlock: React.FC<TextBlockProps> = ({
  title,
  subtitle,
  content,
  variant = 'default',
  markdown = false,
  align = 'left',
  className
}) => {
  const variantClasses = {
    default: 'bg-white border-gray-100',
    highlight: 'bg-blue-50 border-blue-200',
    quote: 'bg-gray-50 border-l-4 border-[#1B75BB] pl-6',
    alert: 'bg-red-50 border-red-200',
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200'
  };

  const textAlignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="text-emerald-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-600" size={20} />;
      case 'error':
      case 'alert':
        return <AlertCircle className="text-red-600" size={20} />;
      case 'highlight':
        return <Info className="text-blue-600" size={20} />;
      default:
        return null;
    }
  };

  const icon = getIcon();

  const renderContent = () => {
    if (markdown && typeof content === 'string') {
      // Suporte básico a markdown (pode ser expandido)
      const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br />');

      return (
        <div
          className={`prose prose-sm max-w-none ${textAlignClasses[align]}`}
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      );
    }

    if (typeof content === 'string') {
      return (
        <p className={`text-gray-700 leading-relaxed ${textAlignClasses[align]}`}>
          {content}
        </p>
      );
    }

    return content;
  };

  return (
    <BlockContainer title={title} subtitle={subtitle} className={className}>
      <div className={`p-4 rounded-lg border ${variantClasses[variant]}`}>
        {icon && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <div className="flex-1">{renderContent()}</div>
          </div>
        )}
        {!icon && renderContent()}
      </div>
    </BlockContainer>
  );
};

/**
 * Helper: Cria um bloco de alerta rápido
 */
export const AlertBlock: React.FC<{
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
}> = ({ type, title, message }) => {
  const variantMap = {
    success: 'success' as const,
    warning: 'warning' as const,
    error: 'error' as const,
    info: 'highlight' as const
  };

  return (
    <TextBlock
      id={`alert-${Date.now()}`}
      type="text"
      title={title}
      content={message}
      variant={variantMap[type]}
    />
  );
};
