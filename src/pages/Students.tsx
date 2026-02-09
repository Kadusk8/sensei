import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StudentList } from '@/components/students/StudentList';
import { AddStudentModal } from '@/components/students/AddStudentModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EvolutionService } from '@/services/whatsapp';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationPanel } from "@/components/students/GraduationPanel";

export function Students() {
    const { role } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);

    // WhatsApp State
    const [service, setService] = React.useState<EvolutionService | null>(null);
    const [instanceName, setInstanceName] = React.useState<string>('sensei-primary');

    React.useEffect(() => {
        const savedUrl = localStorage.getItem('evolution_api_url');
        const savedKey = localStorage.getItem('evolution_api_key');
        const savedInstance = localStorage.getItem('evolution_instance_name');

        if (savedUrl && savedKey) {
            setService(new EvolutionService(savedUrl, savedKey));
        }
        if (savedInstance) setInstanceName(savedInstance);
    }, []);

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Alunos</h2>
                    <p className="text-zinc-400 mt-1">Gerencie os membros da academia e suas frequências.</p>
                </div>
                {role !== 'professor' && (
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Aluno
                    </Button>
                )}
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList className="bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="list" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">Lista de Alunos</TabsTrigger>
                    <TabsTrigger value="graduation" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-400">Sistema de Graduação</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <StudentList key={refreshKey} />
                </TabsContent>

                <TabsContent value="graduation" className="space-y-4">
                    <GraduationPanel />
                </TabsContent>
            </Tabs>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setRefreshKey(prev => prev + 1);
                }}
                whatsappService={service}
                instanceName={instanceName}
            />
        </div>
    );
}
