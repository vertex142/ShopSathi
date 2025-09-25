import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  IconComponent: React.ElementType;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, IconComponent, color }) => {
    const colorClasses = {
        green: 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-300',
        yellow: 'border-yellow-500 bg-yellow-50 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300',
        red: 'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-300',
        blue: 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
        orange: 'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300',
    };

    const iconBgClasses = {
        green: 'bg-green-100 dark:bg-green-800/60',
        yellow: 'bg-yellow-100 dark:bg-yellow-800/60',
        red: 'bg-red-100 dark:bg-red-800/60',
        blue: 'bg-blue-100 dark:bg-blue-800/60',
        orange: 'bg-orange-100 dark:bg-orange-800/60',
    };

    return (
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center space-x-4 border-l-4 transition-transform duration-200 hover:scale-105 ${colorClasses[color]}`}>
            <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
                <IconComponent className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;