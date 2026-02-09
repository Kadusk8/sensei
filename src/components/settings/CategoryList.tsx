import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Tag, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AddCategoryModal } from './AddCategoryModal';
import { Badge } from '@/components/ui/badge';

interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'both';
}

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) {
                // Check if error is related to table missing
                if (error.code === '42P01') {
                    // Table doesn't exist yet, we handle gracefully
                    setCategories([]);
                } else {
                    throw error;
                }
            } else {
                setCategories(data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) return;

        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            fetchCategories();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            alert('Erro ao excluir: ' + error.message);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'income': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Receita</Badge>;
            case 'expense': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Despesa</Badge>;
            default: return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">Ambos</Badge>;
        }
    };

    return (
        <>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Tag className="h-5 w-5 text-pink-500" />
                            Categorias Financeiras
                        </CardTitle>
                        <CardDescription>
                            Gerencie as categorias usadas para classificar receitas e despesas.
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsModalOpen(true)}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Categoria
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg">
                            <p className="text-zinc-500 text-sm mb-2">Nenhuma categoria encontrada.</p>
                            <p className="text-xs text-zinc-600">Se você acabou de criar o sistema, rode o script SQL para criar a tabela.</p>
                            <Button variant="outline" size="sm" onClick={fetchCategories} className="mt-2">
                                <RefreshCw className="h-3 w-3 mr-2" /> Tentar Novamente
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 group hover:border-zinc-700 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{cat.name}</span>
                                        <div className="mt-1">{getTypeBadge(cat.type)}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(cat.id, cat.name)}
                                        className="h-8 w-8 text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddCategoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCategories}
            />
        </>
    );
}
