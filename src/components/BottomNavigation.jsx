import React from 'react';
import { BookOpen, History, UserPlus, CloudSun, User } from 'lucide-react';

export default function BottomNavigation({ activeTab, setActiveTab, isTimerRunning, currentUser }) {
  const tabs = [
    {
      id: 'diary',
      label: 'Diary',
      icon: BookOpen,
      badge: isTimerRunning ? 'LIVE' : null,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
    {
      id: 'add_customer',
      label: 'Add Customer',
      icon: UserPlus,
    },
    {
      id: 'weather',
      label: 'Weather',
      icon: CloudSun,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E2DC] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-2xl mx-auto px-1 sm:px-2 flex items-center justify-around h-16 sm:h-18">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors select-none ${
                isActive
                  ? 'text-[#1F5E3B] font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-4 bg-red-600 text-white text-[9px] font-black px-1 py-0.2 rounded-full animate-pulse flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight truncate max-w-[65px] sm:max-w-none ${isActive ? 'font-black text-[#1F5E3B]' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-6 sm:w-8 h-1 bg-[#1F5E3B] rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
