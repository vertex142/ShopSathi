import React, { useState, useMemo } from 'react';
import { JobOrder, Customer, JobStatus } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JobCalendarViewProps {
    jobs: JobOrder[];
    customers: Customer[];
    onViewDetails: (job: JobOrder) => void;
}

const getStatusColorClass = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Completed:
      case JobStatus.Delivered:
        return 'bg-green-500 hover:bg-green-600';
      case JobStatus.Printing:
        return 'bg-blue-500 hover:bg-blue-600';
      case JobStatus.Designing:
        return 'bg-yellow-500 hover:bg-yellow-600';
      case JobStatus.Pending:
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
};

const JobCalendarView: React.FC<JobCalendarViewProps> = ({ jobs, customers, onViewDetails }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const jobsByDate: { [key: string]: JobOrder[] } = {};
        jobs.forEach(job => {
            if (job.dueDate) {
                const dateKey = new Date(job.dueDate).toDateString();
                if (!jobsByDate[dateKey]) {
                    jobsByDate[dateKey] = [];
                }
                jobsByDate[dateKey].push(job);
            }
        });

        const days = [];
        // Add blank days for the start of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ key: `blank-${i}`, day: null, jobs: [] });
        }
        // Add actual days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateKey = date.toDateString();
            days.push({ key: dateKey, day, jobs: jobsByDate[dateKey] || [] });
        }
        return days;

    }, [currentDate, jobs]);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().toDateString();

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <header className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronLeft /></button>
                <h2 className="text-xl font-semibold">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100"><ChevronRight /></button>
            </header>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200 border-t border-l border-gray-200">
                {weekdays.map(day => (
                    <div key={day} className="py-2 text-center font-semibold text-sm text-gray-600 bg-gray-50">{day}</div>
                ))}
                {calendarGrid.map(({ key, day, jobs }) => (
                    <div key={key} className="relative min-h-[120px] bg-white p-2 border-b border-r border-gray-200">
                        {day && (
                            <span className={`absolute top-2 right-2 text-xs font-semibold ${key === today ? 'bg-brand-blue text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-gray-500'}`}>
                                {day}
                            </span>
                        )}
                        <div className="mt-8 space-y-1">
                            {jobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => onViewDetails(job)}
                                    className={`w-full text-left p-1 rounded-md text-white text-xs truncate ${getStatusColorClass(job.status)}`}
                                    title={`${job.jobName} - ${customers.find(c => c.id === job.customerId)?.name}`}
                                >
                                    {job.jobName}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobCalendarView;