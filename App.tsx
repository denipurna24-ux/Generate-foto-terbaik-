
import React, { useState } from 'react';
import Header from './components/Header';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import Chatbot from './components/Chatbot';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATE);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.GENERATE:
        return <ImageGenerator />;
      case Tab.EDIT:
        return <ImageEditor />;
      case Tab.CHAT:
        return <Chatbot />;
      default:
        return <ImageGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
