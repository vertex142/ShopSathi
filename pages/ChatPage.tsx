import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { ChatConversation, Customer } from '../types';
import { Search, Send, MessageSquare, User, Bot } from 'lucide-react';

interface ChatPageProps {
    initialCustomerId: string | null;
    onCustomerSelect: (customerId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ initialCustomerId, onCustomerSelect }) => {
    const { state, dispatch } = useData();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversationsWithDetails = useMemo(() => {
        return state.chatConversations
            .map(convo => {
                const customer = state.customers.find(c => c.id === convo.customerId);
                const lastMessage = convo.messages[convo.messages.length - 1];
                return { ...convo, customerName: customer?.name, lastMessageText: lastMessage?.text };
            })
            .sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
    }, [state.chatConversations, state.customers]);

    const selectedConversation = useMemo(() => {
        return state.chatConversations.find(c => c.id === selectedConversationId);
    }, [selectedConversationId, state.chatConversations]);
    
    const selectedCustomer = useMemo(() => {
        return state.customers.find(c => c.id === selectedConversation?.customerId);
    }, [selectedConversation, state.customers]);

    useEffect(() => {
        if (initialCustomerId) {
            handleSelectConversation(initialCustomerId);
        }
    }, [initialCustomerId]);

    useEffect(() => {
        if (selectedConversationId) {
            dispatch({ type: 'MARK_CHAT_AS_READ', payload: selectedConversationId });
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversationId, selectedConversation?.messages.length, dispatch]);
    
    const handleSelectConversation = (customerId: string) => {
        setSelectedConversationId(customerId);
// FIX: Added a check to prevent creating a new system message if a conversation already exists for the selected customer.
        const conversationExists = state.chatConversations.some(c => c.customerId === customerId);
        if (!conversationExists) {
            // Dispatch an action to create conversation if it doesn't exist
            dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { customerId, text: '', author: 'system' } });
        }
        setCustomerSearch('');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedConversationId) return;

        dispatch({
            type: 'SEND_CHAT_MESSAGE',
            payload: { customerId: selectedConversationId, text: messageText, author: 'staff' },
        });
        setMessageText('');
    };

    const handleSimulateReply = () => {
        if (!selectedConversationId) return;
        const replies = ["Okay, thank you!", "Got it, thanks for the update.", "I'll get back to you soon.", "That sounds good.", "Can you please provide more details?"];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        dispatch({
            type: 'SEND_CHAT_MESSAGE',
            payload: { customerId: selectedConversationId, text: randomReply, author: 'customer' },
        });
    };

    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return [];
        return state.customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
    }, [customerSearch, state.customers]);

    return (
        <div className="flex h-[calc(100vh-160px)] bg-white rounded-lg shadow-md border">
            {/* Left Panel: Conversation List */}
            <div className="w-1/3 border-r flex flex-col">
                <div className="p-4 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search or start new chat"
                            value={customerSearch}
                            onChange={e => setCustomerSearch(e.target.value)}
                            className="w-full p-2 pl-10 bg-gray-100 text-gray-900 border border-gray-200 rounded-md"
                        />
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {customerSearch ? (
                        filteredCustomers.map(customer => (
                            <div key={customer.id} onClick={() => handleSelectConversation(customer.id)} className="p-4 flex items-center space-x-3 hover:bg-gray-100 cursor-pointer">
                                <User className="h-10 w-10 text-gray-400 bg-gray-200 p-2 rounded-full" />
                                <div>
                                    <p className="font-semibold text-gray-800">{customer.name}</p>
                                    <p className="text-sm text-gray-500">Start a new conversation</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        conversationsWithDetails.map(convo => (
                            <div key={convo.id} onClick={() => setSelectedConversationId(convo.id)} className={`p-4 flex items-center space-x-3 cursor-pointer ${selectedConversationId === convo.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <User className="h-10 w-10 text-gray-400 bg-gray-200 p-2 rounded-full" />
                                <div className="flex-grow overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-800 truncate">{convo.customerName}</p>
                                        <p className="text-xs text-gray-400 flex-shrink-0">{new Date(convo.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-gray-500 truncate">{convo.lastMessageText}</p>
                                        {convo.unreadByStaff && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Chat View */}
            <div className="w-2/3 flex flex-col">
                {selectedConversation ? (
                    <>
                        <header className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold">{selectedCustomer?.name}</h2>
                                <button onClick={() => onCustomerSelect(selectedCustomer!.id)} className="text-sm text-brand-blue hover:underline">View Profile</button>
                            </div>
                            <button onClick={handleSimulateReply} className="flex items-center text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300">
                                <Bot className="h-4 w-4 mr-2"/>
                                Simulate Customer Reply
                            </button>
                        </header>
                        <main className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-4">
                            {selectedConversation.messages.map(msg => (
                                msg.author !== 'system' && (
                                <div key={msg.id} className={`flex items-end gap-3 ${msg.author === 'staff' ? 'justify-end' : ''}`}>
                                    {msg.author === 'customer' && <User className="h-8 w-8 text-gray-400 bg-gray-200 p-1.5 rounded-full" />}
                                    <div className={`px-4 py-2 rounded-lg max-w-lg ${msg.author === 'staff' ? 'bg-brand-blue text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'}`}>
                                        <p>{msg.text}</p>
                                        <p className={`text-xs mt-1 ${msg.author === 'staff' ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                </div>
                                )
                            ))}
                            <div ref={messagesEndRef} />
                        </main>
                        <footer className="p-4 bg-white border-t">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={e => setMessageText(e.target.value)}
                                    placeholder="Type your message..."
                                    className="w-full p-3 pr-12 bg-gray-100 text-gray-900 border border-gray-200 rounded-lg"
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-white bg-brand-blue p-2 rounded-md hover:bg-brand-blue-light" aria-label="Send message">
                                    <Send className="h-5 w-5" />
                                </button>
                            </form>
                        </footer>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <MessageSquare className="h-16 w-16 text-gray-300" />
                        <h2 className="mt-4 text-xl font-semibold">Select a conversation</h2>
                        <p className="mt-1">Or search for a customer to start a new chat.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;