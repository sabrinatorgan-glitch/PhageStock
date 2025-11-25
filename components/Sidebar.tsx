import React from 'react';
import { LayoutDashboard, Package, ClipboardList, Settings, TestTube2, BrainCircuit, Users, LogOut, ChevronDown } from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  currentUser: User;
  onSwitchRole: (role: UserRole) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onSwitchRole }) => {
  
  // Define menu visibility based on role
  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard General', 
      icon: LayoutDashboard, 
      roles: [UserRole.MASTER_ADMIN, UserRole.ADMIN, UserRole.COMMON_USER] 
    },
    { 
      id: 'inventory', 
      label: 'Gestión de Stock', 
      icon: Package, 
      roles: [UserRole.MASTER_ADMIN, UserRole.ADMIN, UserRole.COMMON_USER] 
    },
    { 
      id: 'requisitions', 
      label: 'Lab & Pedidos', 
      icon: TestTube2, 
      roles: [UserRole.MASTER_ADMIN, UserRole.ADMIN, UserRole.COMMON_USER] 
    },
    { 
      id: 'audit', 
      label: 'Conciliación Inventario', 
      icon: ClipboardList, 
      roles: [UserRole.MASTER_ADMIN] 
    },
    { 
      id: 'assistant', 
      label: 'Asistente IA', 
      icon: BrainCircuit, 
      roles: [UserRole.MASTER_ADMIN, UserRole.ADMIN] 
    },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10 transition-all duration-300">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pharma-500 to-teal-400 bg-clip-text text-transparent">
          PhageLab Stock
        </h1>
        <p className="text-xs text-slate-400 mt-1">Management System v1.2</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          if (!item.roles.includes(currentUser.role)) return null;
          
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-pharma-600 text-white shadow-lg shadow-pharma-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User & Role Switcher Section (For Prototype Demo) */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-pharma-600 flex items-center justify-center text-white font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
            <p className="text-xs text-pharma-300 truncate">{currentUser.role}</p>
          </div>
        </div>

        <div className="relative group">
           <button className="w-full text-xs flex items-center justify-between bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded transition">
             <span>Cambiar Rol (Demo)</span>
             <ChevronDown size={14} />
           </button>
           <div className="absolute bottom-full left-0 w-full mb-2 bg-slate-700 rounded-lg shadow-xl overflow-hidden hidden group-hover:block border border-slate-600">
             <button onClick={() => onSwitchRole(UserRole.MASTER_ADMIN)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-600 text-purple-300">Master Admin</button>
             <button onClick={() => onSwitchRole(UserRole.ADMIN)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-600 text-blue-300">Admin</button>
             <button onClick={() => onSwitchRole(UserRole.COMMON_USER)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-600 text-slate-300">Common User</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;