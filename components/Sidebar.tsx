import React from 'react';
import type { Page } from '../types';
import { NAV_GROUPS } from '../constants';
import Logo from './Logo';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();

  const handleLinkClick = (page: Page) => {
    setCurrentPage(page);
    onClose();
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-blue text-white flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center space-x-3 border-b border-brand-blue-light">
         <Logo className="h-10 w-10" />
         <h1 className="text-xl font-bold tracking-wider">ShopSathi</h1>
      </div>
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? "mt-4" : ""}>
            <h2 className="px-4 mb-1 text-xs font-semibold tracking-wider text-blue-200 uppercase">{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleLinkClick(item.id)}
                    className={`flex items-center w-full px-4 py-2 my-1 text-sm font-medium transition-colors duration-200 rounded-md text-left ${
                      currentPage === item.id
                        ? 'bg-white text-brand-blue'
                        : 'text-blue-100 hover:bg-brand-blue-light hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
       <div className="p-4 border-t border-brand-blue-light flex justify-between items-center text-xs text-blue-200">
          <div className="text-left">
            <p>&copy; {new Date().getFullYear()} ShopSathi</p>
            <p>Built by Shahidul Islam</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-brand-blue-light hover:bg-brand-blue-dark transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-yellow-300" />}
          </button>
      </div>
    </div>
  );
};

export default Sidebar;