import React, { useState, useEffect } from 'react';
import { Sun, Moon, Cloud } from 'lucide-react';

const GreetingCard: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const getGreeting = () => {
        const hour = time.getHours();
        if (hour < 12) return { text: 'Good Morning', icon: <Sun className="h-8 w-8 text-yellow-400" /> };
        if (hour < 18) return { text: 'Good Afternoon', icon: <Cloud className="h-8 w-8 text-sky-400" /> };
        return { text: 'Good Evening', icon: <Moon className="h-8 w-8 text-indigo-400" /> };
    };

    const { text, icon } = getGreeting();
    const formattedDate = time.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const formattedTime = time.toLocaleTimeString();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center space-x-3">
                    {icon}
                    <h2 className="text-2xl font-bold text-gray-800">{text}!</h2>
                </div>
                <p className="text-gray-500 mt-1">{formattedDate}</p>
            </div>
            <div className="text-right">
                <p className="text-4xl font-mono font-bold text-brand-blue tracking-wider">{formattedTime}</p>
            </div>
        </div>
    );
};

export default GreetingCard;