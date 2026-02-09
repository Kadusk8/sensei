import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { AddPlanModal } from './AddPlanModal';

interface Plan {
    id: string;
    name: string;
    price: number;
    weekly_limit: number;
}

export function PlanList() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        try {
            // 1. Check for linked students
            const { count, error: countError } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('plan_id', id);

            if (countError) throw countError;

            if (count && count > 0) {
                if (!confirm(`Este plano está vinculado a ${count} alunos.\n\nDeseja excluir mesmo assim?\nIsso deixará esses alunos "Sem Plano".`)) {
                    return;
                }

                // 2. Unlink students (Set plan_id to null)
                const { error: updateError } = await supabase
                    .from('students')
// @ts-ignore
                    .update({ plan_id: null })
                    .eq('plan_id', id);

                if (updateError) throw updateError;
            } else {
                if (!confirm(`Tem certeza que deseja excluir o plano "${name}"?`)) return;
            }

            // 3. Delete the plan
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;

            fetchPlans();
        } catch (error: any) {
            console.error('Error deleting plan:', error);
            alert('Erro ao excluir plano: ' + (error.message || error));
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingPlan(null);
        setIsModalOpen(true);
    };

    return (
        <>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Ticket className="h-5 w-5 text-purple-500" />
                        Planos e Assinaturas
                    </CardTitle>
                    <Button
                        size="sm"
                        onClick={handleAddNew}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Plano
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-zinc-500 text-sm">Carregando planos...</div>
                    ) : plans.length === 0 ? (
                        <div className="text-zinc-500 text-sm py-4 text-center border border-dashed border-zinc-800 rounded-lg">
                            Nenhum plano cadastrado.
                        </div>
                    ) : (
                        <div className="rounded-md border border-zinc-800 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-zinc-800/50 text-zinc-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3">Preço</th>
                                        <th className="px-4 py-3">Limite Semanal</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {plans.map((plan) => (
                                        <tr key={plan.id} className="group hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-4 py-3 text-white font-medium">{plan.name}</td>
                                            <td className="px-4 py-3 text-zinc-300">{formatCurrency(plan.price)}</td>
                                            <td className="px-4 py-3 text-zinc-300">
                                                {plan.weekly_limit} aulas/semana
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(plan)}
                                                        className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(plan.id, plan.name)}
                                                        className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddPlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchPlans}
                planToEdit={editingPlan}
            />
        </>
    );
}
