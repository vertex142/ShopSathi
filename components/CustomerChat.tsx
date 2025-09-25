import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { ChatConversation, Customer, ChatMessage } from '../types';
import { Send, User, Bot, Sparkles, LoaderCircle } from 'lucide-react';
import { suggestChatReply } from '../services/geminiService';

interface CustomerChatProps {
    customerId: string;
}

const CustomerChat: React.FC<CustomerChatProps> = ({ customerId }) => {
    const { state, dispatch } = useData();
    const [messageText, setMessageText] = useState('');
    const [isAiReplying, setIsAiReplying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversation = useMemo(() => {
        return state.chatConversations.find(c => c.customerId === customerId);
    }, [customerId, state.chatConversations]);

    useEffect(() => {
        if (customerId) {
            // Ensure a conversation object exists
            if (!conversation) {
                dispatch({ type: 'SEND_CHAT_MESSAGE', payload: { customerId, text: `Chat started with ${state.customers.find(c=>c.id === customerId)?.name}`, author: 'system' } });
            }
            dispatch({ type: 'MARK_CHAT_AS_READ', payload: customerId });
        }
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [customerId, conversation?.messages.length, dispatch, state.customers, conversation]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;

        dispatch({
            type: 'SEND_CHAT_MESSAGE',
            payload: { customerId, text: messageText, author: 'staff' },
        });
        setMessageText('');
    };
    
    // This is for demo/testing purposes
    const handleSimulateReply = () => {
        const replies = ["Okay, thank you!", "Got it, thanks for the update.", "I'll get back to you soon.", "That sounds good.", "Can you please provide more details?"];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        dispatch({
            type: 'SEND_CHAT_MESSAGE',
            payload: { customerId, text: randomReply, author: 'customer' },
        });
    };

    const handleAiReply = async () => {
        if (!conversation) return;
        setIsAiReplying(true);

        const history = conversation.messages
            .filter(m => m.author !== 'system')
            .slice(-5)
            .map(m => `${m.author === 'staff' ? 'Staff' : 'Customer'}: ${m.text}`)
            .join('\n');

        try {
            const reply = await suggestChatReply(history, state.settings.name);
            setMessageText(reply);
        } catch (error) {
            alert("Could not generate an AI reply. Please try again.");
        } finally {
            setIsAiReplying(false);
        }
    };
    
    if (!conversation) {
        return <div className="p-4 text-center text-gray-500">Loading chat...</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-320px)]">
             <header className="p-4 border-b flex justify-end items-center bg-gray-50">
                <div className="flex items-center space-x-2">
                    {process.env.API_KEY && (
                         <button
                            onClick={handleAiReply}
                            disabled={isAiReplying}
                            className="flex items-center text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md hover:bg-purple-200 disabled:opacity-50"
                        >
                            {isAiReplying ? (
                                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Suggest Reply
                        </button>
                    )}
                    <button onClick={handleSimulateReply} className="flex items-center text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300">
                        <Bot className="h-4 w-4 mr-2"/>
                        Simulate Customer Reply
                    </button>
                </div>
            </header>
            <main className="flex-grow p-6 overflow-y-auto bg-gray-50 space-y-4">
                {conversation.messages.map(msg => (
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
        </div>
    );
};

export default CustomerChat;
