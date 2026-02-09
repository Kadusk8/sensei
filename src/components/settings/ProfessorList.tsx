import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AddProfessorModal } from './AddProfessorModal';


export function ProfessorList() {
    const [professors, setProfessors] = useState<any[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfessors();
    }, []);

    async function fetchProfessors() {
        setLoading(true);
        // Ensure we fetch from 'professors' table
        const { data } = await supabase.from('professors').select('*');
        if (data) setProfessors(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza? Isso pode afetar aulas vinculadas.')) return;

        const { error } = await supabase.from('professors').delete().eq('id', id);
        if (!error) fetchProfessors();
        else alert('Erro ao excluir: ' + error.message);
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        Professores e Staff
                    </CardTitle>
                    <CardDescription>Gerencie a equipe da academia</CardDescription>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-zinc-500 text-sm">Carregando...</div>
                ) : professors.length === 0 ? (
                    <div className="text-zinc-500 text-sm py-4 text-center border border-dashed border-zinc-800 rounded-lg">
                        Nenhum professor cadastrado.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {professors.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-400 font-bold">
                                        {p.full_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{p.full_name}</div>
                                        <div className="text-xs text-zinc-500">
                                            {p.modality ? `${p.modality} • ` : ''}R$ {p.hourly_rate || '0.00'} / hora
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-zinc-500 hover:text-red-500"
                                    onClick={() => handleDelete(p.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <AddProfessorModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchProfessors}
            />
        </Card>
    );
}
