import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, action }) => {
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue dark:bg-blue-600 hover:bg-brand-blue-light dark:hover:bg-blue-500"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;