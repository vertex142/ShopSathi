import React from 'react';
import type { Page } from '../types';
import { NAV_GROUPS } from '../constants';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      // App will redirect automatically
    } catch (error) {
      console.error("Failed to log out", error);
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="w-64 bg-brand-blue text-white flex flex-col">
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
                    onClick={() => setCurrentPage(item.id)}
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
      <div className="p-2 border-t border-brand-blue-light">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 my-1 text-sm font-medium transition-colors duration-200 rounded-md text-left text-blue-100 hover:bg-brand-blue-light hover:text-white"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
       </div>
       <div className="p-4 border-t border-brand-blue-light text-center text-xs text-blue-200">
          <p>&copy; {new Date().getFullYear()} ShopSathi</p>
          <p>Built by Shahidul Islam</p>
      </div>
    </div>
  );
};

export default Sidebar;