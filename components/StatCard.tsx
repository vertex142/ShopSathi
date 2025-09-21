import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  // Fix: Specify that the icon is a ReactElement that accepts SVG props to fix the cloneElement error.
  icon: React.ReactElement<React.ComponentProps<'svg'>>;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {React.cloneElement(icon, { className: "h-6 w-6 text-white" })}
      </div>
    </div>
  );
};

export default StatCard;