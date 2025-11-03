
import React, { useState, useEffect, useRef } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Spinner } from './ui/Spinner';
import { ChatBubbleIcon, SendIcon, UserIcon, BotIcon } from './icons/Icons';
import { Chat } from '@google/genai';

const Chatbot: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      const chatSession = createChatSession();
      setChat(chatSession);
    };
    initChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || !chat) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: userInput });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-[75vh]">
       <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ChatBubbleIcon /> Creative Assistant
        </h2>
       </div>
       <div className="flex-grow p-4 overflow-y-auto bg-gray-800/50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <BotIcon />}
                <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'user' && <UserIcon />}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <BotIcon />
                <div className="max-w-lg p-3 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none">
                  <Spinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
       </div>
       <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              className="flex-grow"
              disabled={isLoading || !chat}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !chat || !userInput.trim()}>
              <SendIcon />
            </Button>
          </div>
       </div>
    </Card>
  );
};

export default Chatbot;
