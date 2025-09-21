
import React from 'react';
import { TimelineEvent } from '../types';
import { FileText, ClipboardCheck, Briefcase, Receipt } from 'lucide-react';

interface ProjectTimelineProps {
    events: TimelineEvent[];
}

const getIconForType = (type: TimelineEvent['type']) => {
    switch(type) {
        case 'quote': return <ClipboardCheck className="h-5 w-5 text-white" />;
        case 'job': return <Briefcase className="h-5 w-5 text-white" />;
        case 'invoice': return <FileText className="h-5 w-5 text-white" />;
        case 'payment': return <Receipt className="h-5 w-5 text-white" />;
        default: return null;
    }
}
const getColorForType = (type: TimelineEvent['type']) => {
     switch(type) {
        case 'quote': return 'bg-purple-500';
        case 'job': return 'bg-blue-500';
        case 'invoice': return 'bg-orange-500';
        case 'payment': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ events }) => {
    if (events.length === 0) {
        return <p className="text-gray-500">No events for this project yet.</p>;
    }

    return (
        <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 h-full w-0.5 bg-gray-200"></div>

            {events.map((event, index) => (
                <div key={event.id} className="relative mb-8">
                    {/* Dot */}
                    <div className={`absolute -left-1 top-1.5 w-8 h-8 rounded-full flex items-center justify-center ${getColorForType(event.type)}`}>
                        {getIconForType(event.type)}
                    </div>
                    
                    <div className="ml-10">
                        <div className="flex items-baseline space-x-2">
                            <h4 className="font-semibold text-gray-800">{event.title}</h4>
                            <span className="text-xs text-gray-500">{event.date}</span>
                        </div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        {event.amount !== undefined && (
                             <p className="text-sm font-medium text-gray-700 mt-1">
                                Amount: <span className={event.type === 'payment' ? 'text-green-600' : 'text-gray-800'}>
                                    ${event.amount.toFixed(2)}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectTimeline;
