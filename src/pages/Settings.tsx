import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from 'lucide-react';
import { PlanList } from '@/components/settings/PlanList';
import { ProfessorList } from '@/components/settings/ProfessorList';
import { UserList } from '@/components/settings/UserList';
import { CategoryList } from '@/components/settings/CategoryList';
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';
import { AutomationSettings } from '@/components/settings/AutomationSettings';
import { GymInfoSettings } from '@/components/settings/GymInfoSettings';

export function Settings() {
    const { role, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && role !== 'admin') {
            navigate('/');
        }
    }, [role, loading, navigate]);

    if (loading) return null;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Configurações</h1>
                    <p className="text-zinc-400">Gerencie suas preferências e dados do sistema</p>
                </div>
            </div>

            <div className="grid gap-6">
                <GymInfoSettings />
                <PlanList />
                <ProfessorList />
                <UserList />
                <CategoryList />
                <AutomationSettings />
                <WhatsAppSettings />

            </div>
        </div >
    );
}
