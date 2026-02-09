
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <Sidebar />
            <main className="pl-64 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
