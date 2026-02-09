import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

interface Activity {
    id: string;
    user: string;
    action: string;
    target: string;
    time: Date;
    image: string;
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        async function fetchActivities() {
            try {
                // 1. Recent Students (Enrollments)
                const { data: students } = await supabase
                    .from('students')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);

                const studentActivities = (students as any[])?.map(s => ({
                    id: s.id,
                    user: s.full_name,
                    action: 'matriculou-se',
                    target: 'Novo Aluno',
                    time: new Date(s.created_at),
                    image: s.avatar_url || `https://ui.shadcn.com/avatars/0${Math.floor(Math.random() * 5) + 1}.png`
                })) || [];

                // 2. Recent Transactions (Payments)
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('*, students(full_name)') // Assuming relation, or use related_user_id
                    .eq('type', 'income')
                    .order('created_at', { ascending: false })
                    .limit(5);

                // Note: Need to handle the join correctly or just fetch basic info
                // For simplicity, if join not setup, we skip user name or fetch separately.
                // Assuming 'category' as target.

                const transactionActivities = (transactions as any[])?.map(t => ({
                    id: t.id,
                    user: 'Sistema', // Placeholder or fetch user
                    action: 'pagamento recebido',
                    target: t.category,
                    time: new Date(t.created_at),
                    image: 'https://placehold.co/100x100/22c55e/ffffff?text=$'
                })) || [];

                // Combine and sort
                const combined = [...studentActivities, ...transactionActivities]
                    .sort((a, b) => b.time.getTime() - a.time.getTime())
                    .slice(0, 5);

                setActivities(combined);

            } catch (error) {
                console.error('Error fetching activities:', error);
            }
        }

        fetchActivities();
    }, []);

    return (
        <Card className="col-span-3 bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white">Atividade Recente</CardTitle>
                <CardDescription className="text-zinc-400">
                    Últimas matrículas e pagamentos.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Nenhuma atividade recente.</p>
                    ) : (
                        activities.map((activity, index) => (
                            <div key={index} className="flex items-center">
                                <div className="h-9 w-9 rounded-full overflow-hidden border border-zinc-700">
                                    <img
                                        src={activity.image}
                                        alt="Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none text-white">
                                        {activity.user}
                                    </p>
                                    <p className="text-sm text-zinc-400">
                                        {activity.action} <span className="text-primary">{activity.target}</span>
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-zinc-500">
                                    {format(activity.time, "d 'de' MMM, HH:mm", { locale: ptBR })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
