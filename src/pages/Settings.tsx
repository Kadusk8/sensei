import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PlanList } from '@/components/settings/PlanList';
import { ProfessorList } from '@/components/settings/ProfessorList';
import { UserList } from '@/components/settings/UserList';
import { CategoryList } from '@/components/settings/CategoryList';
import { WhatsAppSettings } from '@/components/settings/WhatsAppSettings';
import { AutomationSettings } from '@/components/settings/AutomationSettings';
import { GymInfoSettings } from '@/components/settings/GymInfoSettings';

export function Settings() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const clearStatus = () => setTimeout(() => setStatus(null), 3000);

    const handleResetDatabase = async () => {
        if (!confirm('ARE YOU SURE? This will delete ALL data (students, products, transactions, etc).')) return;

        setLoading(true);
        setStatus(null);
        try {
            // Delete in order to respect FK constraints
            await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('class_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('enrollments').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('professors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            setStatus({ type: 'success', message: 'Database cleared successfully!' });
        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error clearing database: ' + error.message });
        } finally {
            setLoading(false);
            clearStatus();
        }
    };

    const handleSeedDatabase = async () => {
        setLoading(true);
        setStatus(null);
        try {
            // 1. Insert Plans
            const { data: plans } = await supabase.from('plans').insert([
                { name: 'Básico Fixo (3x/sem)', price: 150.00, weekly_limit: 3 },
                { name: 'Básico Flex (3x/sem)', price: 180.00, weekly_limit: 3 },
                { name: 'Pleno Fixo (1 Mod/Dia)', price: 300.00, weekly_limit: 7 },
                { name: 'Pleno Flex (1 Mod/Dia)', price: 350.00, weekly_limit: 7 },
                { name: 'Elite Fixo (2 Mods/3x)', price: 350.00, weekly_limit: 6 },
                { name: 'Elite Flex (2 Mods/3x)', price: 400.00, weekly_limit: 6 }
            ] as unknown as any).select();

            if (!plans) throw new Error('Failed to create plans');

            // 2. Insert Products
            await supabase.from('products').insert([
                { name: 'Whey Protein Gold', price: 250.00, stock_quantity: 15, image_url: 'https://placehold.co/200x200?text=Whey' },
                { name: 'Creatine Monohydrate', price: 120.00, stock_quantity: 8, image_url: 'https://placehold.co/200x200?text=Creatine' },
                { name: 'Pre-Workout Energy', price: 180.00, stock_quantity: 20, image_url: 'https://placehold.co/200x200?text=Pre-Work' },
                { name: 'Protein Bar (Box)', price: 80.00, stock_quantity: 30, image_url: 'https://placehold.co/200x200?text=Bar' },
                { name: 'Gym T-Shirt', price: 60.00, stock_quantity: 50, image_url: 'https://placehold.co/200x200?text=Shirt' },
                { name: 'Shaker Bottle', price: 35.00, stock_quantity: 12, image_url: 'https://placehold.co/200x200?text=Shaker' }
            ] as unknown as any);

            // 3. Insert Students
            const mockStudents = [
                { full_name: 'Sarah Miller', status: 'active', avatar_url: 'https://randomuser.me/api/portraits/women/1.jpg' },
                { full_name: 'Michael Chen', status: 'active', avatar_url: 'https://randomuser.me/api/portraits/men/2.jpg' },
                { full_name: 'Jessica Jones', status: 'debt', avatar_url: 'https://randomuser.me/api/portraits/women/3.jpg' },
                { full_name: 'David Wilson', status: 'inactive', avatar_url: 'https://randomuser.me/api/portraits/men/4.jpg' },
                { full_name: 'Amanda Smith', status: 'active', avatar_url: 'https://randomuser.me/api/portraits/women/5.jpg' },
            ];

            await supabase.from('students').insert(
                mockStudents.map(s => ({
                    ...s,
                    // @ts-ignore
                    plan_id: plans![Math.floor(Math.random() * plans!.length)].id
                })) as unknown as any
            );

            setStatus({ type: 'success', message: 'Seed data injected successfully!' });
        } catch (error: any) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error seeding database: ' + error.message });
        } finally {
            setLoading(false);
            clearStatus();
        }
    };
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

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            Gerenciamento de Dados
                        </CardTitle>
                        <CardDescription>
                            Controle o conteúdo do seu banco de dados. Use para desenvolvimento e testes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {status && (
                            <div className={`p-4 rounded-lg flex items-center gap-2 ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {status.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                {status.message}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={handleSeedDatabase}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Gerar Dados de Teste
                            </Button>

                            <Button
                                onClick={handleResetDatabase}
                                disabled={loading}
                                variant="destructive"
                                className="bg-red-900/20 text-red-500 hover:bg-red-900/40 border-red-900/50 border"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Resetar Banco de Dados (Apagar Tudo)
                            </Button>
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            * "Gerar Dados de Teste" criará Planos, Produtos e Alunos de exemplo.<br />
                            * "Resetar Banco de Dados" apagará permanentemente todos os registros.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
