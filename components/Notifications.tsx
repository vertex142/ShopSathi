import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Page } from '../types';
import { Bell, FileText, AlertTriangle, BellRing } from 'lucide-react';
import { formatDistanceToNow } from '../utils/timeUtils';

interface NotificationsProps {
    setCurrentPage: (page: Page) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ setCurrentPage }) => {
    const { state, dispatch } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const unreadCount = useMemo(() => {
        return state.notifications.filter(n => !n.read).length;
    }, [state.notifications]);

    const sortedNotifications = useMemo(() => {
        return [...state.notifications].sort((a, b) => b.timestamp - a.timestamp);
    }, [state.notifications]);

    const handleMarkAllAsRead = () => {
        dispatch({ type: 'MARK_ALL_NOTIFICATIONS_AS_READ', payload: null });
    };

    const handleNotificationClick = (linkTo?: Page) => {
        if (linkTo) {
            setCurrentPage(linkTo);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [panelRef]);

    const getIconForType = (type: string) => {
        switch(type) {
            case 'invoice-overdue':
            case 'invoice-reminder':
                return <FileText className="h-5 w-5 text-blue-500" />;
            case 'low-stock':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            default:
                return <BellRing className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative text-gray-500 hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue rounded-full p-2"
                aria-label="View notifications"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <div className="flex justify-between items-center px-4 py-2 border-b">
                            <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="text-xs text-brand-blue hover:underline">
                                    Mark all as read
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {sortedNotifications.length > 0 ? (
                                sortedNotifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification.linkTo)}
                                        className={`w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                                        role="menuitem"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 pt-0.5">{getIconForType(notification.type)}</div>
                                            <div className="flex-1">
                                                <p className="font-medium">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(notification.timestamp)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-6 px-4">No notifications yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;
