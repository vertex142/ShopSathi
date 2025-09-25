import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  IconComponent: React.ElementType;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, IconComponent, color }) => {
    const colorClasses = {
        green: 'border-green-500 bg-green-50 text-green-600',
        yellow: 'border-yellow-500 bg-yellow-50 text-yellow-600',
        red: 'border-red-500 bg-red-50 text-red-600',
        blue: 'border-blue-500 bg-blue-50 text-blue-600',
        orange: 'border-orange-500 bg-orange-50 text-orange-600',
    };

    const iconBgClasses = {
        green: 'bg-green-100',
        yellow: 'bg-yellow-100',
        red: 'bg-red-100',
        blue: 'bg-blue-100',
        orange: 'bg-orange-100',
    };

    return (
        <div className={`bg-white p-4 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${colorClasses[color]}`}>
            <div className={`p-3 rounded-full ${iconBgClasses[color]}`}>
                <IconComponent className="h-6 w-6" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;
