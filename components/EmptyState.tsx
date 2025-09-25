import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  message: string;
  actionButton?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, actionButton }) => {
  return (
    <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
        <Icon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-400">{message}</p>
      {actionButton && <div className="mt-6">{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
