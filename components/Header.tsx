
import React from 'react';
import { Tab } from '../types';
import { SparklesIcon, PencilIcon, ChatBubbleIcon } from './icons/Icons';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { name: Tab.GENERATE, icon: <SparklesIcon /> },
    { name: Tab.EDIT, icon: <PencilIcon /> },
    { name: Tab.CHAT, icon: <ChatBubbleIcon /> },
  ];

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
              Gemini Creative Suite
            </div>
          </div>
          <nav className="flex space-x-1 sm:space-x-2 bg-gray-800 p-1 rounded-full">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                  activeTab === tab.name
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
