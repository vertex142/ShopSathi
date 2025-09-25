import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useData } from '../context/DataContext';
import { Bot, Sparkles, X, Send, LoaderCircle } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const AIAssistant: React.FC = () => {
    const { state } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!process.env.API_KEY) return;
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are a helpful business assistant for a printing company. 
        You have access to the company's current data in JSON format, which includes customers, invoices, job orders, and expenses. 
        Use this data to answer the user's questions accurately and concisely. 
        When asked to draft communications (like emails or reminders), provide professional, ready-to-use templates. 
        Do not mention that you have access to JSON data; just use it to answer the questions directly.`;

        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction,
            }
        });

    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatRef.current) return;

        const userMessage: Message = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Add model's placeholder message
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const context = `Here is the current business data: ${JSON.stringify(state)}. Please use this to answer the following question.`;
            const fullPrompt = `${context}\n\nUser Question: ${input}`;
            
            const result = await chatRef.current.sendMessageStream({ message: fullPrompt });

            for await (const chunk of result) {
                const chunkText = chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text += chunkText;
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("AI Assistant Error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].text = "Sorry, I encountered an error. Please try again.";
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSend();
        }
    }

    if (!process.env.API_KEY) {
        return null;
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-brand-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-blue-light transition-transform transform hover:scale-110 z-50"
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-20 right-6 w-full max-w-md bg-white rounded-lg shadow-2xl flex flex-col h-[60vh] z-50 border border-gray-200">
                    <header className="flex items-center justify-between p-4 bg-gray-50 border-b rounded-t-lg">
                        <div className="flex items-center space-x-2">
                            <Bot className="h-6 w-6 text-brand-blue" />
                            <h3 className="text-lg font-semibold text-gray-800">AI Assistant</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <main className="flex-1 p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <Bot className="h-6 w-6 text-brand-blue flex-shrink-0 mt-1" />}
                                <div className={`px-4 py-2 rounded-lg max-w-xs md:max-w-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    {msg.text}
                                    {isLoading && index === messages.length -1 && <LoaderCircle className="h-4 w-4 animate-spin inline-block ml-2" />}
                                </div>
                            </div>
                        ))}
                         {messages.length === 0 && (
                            <div className="text-center text-gray-500 p-8">
                                <p>Welcome! How can I help you manage your business today?</p>
                                <p className="text-sm mt-2">e.g., "Which invoices are overdue?" or "Draft a payment reminder email."</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>

                    <footer className="p-4 bg-white border-t rounded-b-lg">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask me anything..."
                                className="w-full p-2 pr-10 bg-white text-gray-900 placeholder:text-gray-500 border border-gray-300 rounded-md shadow-sm focus:ring-brand-blue focus:border-brand-blue disabled:bg-gray-100"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-blue disabled:opacity-50"
                                aria-label="Send message"
                            >
                                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};

export default AIAssistant;