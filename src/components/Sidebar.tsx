
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, ShoppingCart, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Painel', path: '/', roles: ['admin', 'secretary', 'professor'] },
    { icon: Users, label: 'Alunos', path: '/students', roles: ['admin', 'secretary', 'professor'] },
    { icon: CalendarDays, label: 'Aulas', path: '/classes', roles: ['admin', 'secretary', 'professor'] },
    { icon: Wallet, label: 'Financeiro', path: '/financial', roles: ['admin'] },
    { icon: ShoppingCart, label: 'PDV', path: '/pdv', roles: ['admin', 'secretary'] },
];

export function Sidebar() {
    const { role, signOut } = useAuth();

    // Safety check: if no role yet (loading), show nothing or minimal
    // But Layout renders this so it might flicker. AuthContext loading handles main app.

    return (
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 h-screen fixed left-0 top-0 flex flex-col items-center py-6">
            <div className="flex items-center gap-3 mb-10 px-6 w-full">
                <img src="/sensei-logo.png" alt="Sensei Logo" className="h-12 w-auto object-contain" />
                <div className="flex flex-col">
                    {/* <span className="text-xl font-bold text-white tracking-tight">Sensei</span> */}
                    {role && <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 bg-zinc-800 px-2 py-0.5 rounded-full w-fit">{role}</span>}
                </div>
            </div>

            <nav className="w-full px-4 flex-1 space-y-2">
                {navItems.filter(item => !role || item.roles.includes(role)).map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            )
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="w-full px-4 mt-auto space-y-2">
                {role !== 'professor' && (
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-zinc-800 text-white"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            )
                        }
                    >
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Configurações</span>
                    </NavLink>
                )}
                <button
                    onClick={() => signOut()}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-900/10 hover:text-red-500 w-full transition-colors mt-2"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sair</span>
                </button>
            </div>
        </aside>
    );
}
