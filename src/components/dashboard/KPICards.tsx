import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, AlertCircle, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function KPICards() {
    const [stats, setStats] = useState({
        activeStudents: 0,
        monthlyRevenue: 0,
        debtors: 0,
        activeProfessors: 0
    });

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Active Students
                const { count: activeStudents } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');

                // 2. Monthly Revenue (Paid Incomes in current month)
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('amount')
                    .eq('type', 'income')
                    .eq('status', 'paid')
                    .gte('created_at', startOfMonth);

                const monthlyRevenue = (transactions as any[])?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

                // 3. Debtors
                const { count: debtors } = await supabase
                    .from('students')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'debt');

                // 4. Active Professors
                const { count: activeProfessors } = await supabase
                    .from('professors')
                    .select('*', { count: 'exact', head: true });

                setStats({
                    activeStudents: activeStudents || 0,
                    monthlyRevenue,
                    debtors: debtors || 0,
                    activeProfessors: activeProfessors || 0
                });

            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        }

        fetchStats();
    }, []);

    const kpiData = [
        {
            title: 'Alunos Ativos',
            value: stats.activeStudents.toString(),
            change: 'Total de alunos regulares',
            icon: Users,
            color: 'text-blue-500',
        },
        {
            title: 'Receita Mensal',
            value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: 'Recebimentos deste mês',
            icon: TrendingUp,
            color: 'text-green-500',
        },
        {
            title: 'Inadimplentes',
            value: stats.debtors.toString(),
            change: 'Alunos com pendências',
            icon: AlertCircle,
            color: 'text-red-500',
        },
        {
            title: 'Professores',
            value: stats.activeProfessors.toString(),
            change: 'Instrutores cadastrados',
            icon: UserCheck,
            color: 'text-purple-500',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpiData.map((kpi) => (
                <Card key={kpi.title} className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            {kpi.title}
                        </CardTitle>
                        <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{kpi.value}</div>
                        <p className="text-xs text-zinc-500 mt-1">{kpi.change}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
