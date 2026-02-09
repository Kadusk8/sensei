import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Wallet, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format, isBefore, startOfDay, isToday, addDays } from 'date-fns';
import type { Database } from '@/types/database';
import { EvolutionService } from '@/services/whatsapp';

type Transaction = Database['public']['Tables']['transactions']['Row'] & { phone?: string };

interface AccountsReceivableListProps {
    transactions: Transaction[];
    onReceive: (transaction: Transaction) => void;
}

export function AccountsReceivableList({ transactions, onReceive }: AccountsReceivableListProps) {
    const [service, setService] = useState<EvolutionService | null>(null);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [instanceName, setInstanceName] = useState<string>('sensei-primary');

    useEffect(() => {
        const savedUrl = localStorage.getItem('evolution_api_url');
        const savedKey = localStorage.getItem('evolution_api_key');
        const savedInstance = localStorage.getItem('evolution_instance_name');

        if (savedUrl && savedKey) {
            setService(new EvolutionService(savedUrl, savedKey));
        }
        if (savedInstance) setInstanceName(savedInstance);
    }, []);

    const handleSendCharge = async (t: Transaction) => {
        if (!service) return alert('Configure o WhatsApp nas Configurações primeiro.');
        if (!t.phone) return alert('Aluno sem telefone cadastrado.');

        // Validation for phone (same as Settings)
        let phone = t.phone.replace(/\D/g, '');
        if (phone.length <= 11) {
            // Assume BR if small number
            phone = '55' + phone;
        }

        const name = t.category.match(/^\[(.*?)\]\s*(.*)/)?.[2] || 'Aluno'; // Extract name from "[Mensalidade] Nome"
        const message = `Olá, ${name}! 🥋\n\nIdentificamos que sua mensalidade no valor de *${formatCurrency(t.amount)}* está em aberto.\n\nPoderia nos enviar o comprovante assim que possível? Obrigado!`;

        if (!confirm(`Enviar cobrança para ${name} (${phone})?\n\n"${message}"`)) return;

        setSendingId(t.id);
        try {
            await service.sendText(instanceName, phone, message);
            alert('Cobrança enviada com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar mensagem.');
        } finally {
            setSendingId(null);
        }
    };

    // Filter pending income (Student Fees)
    const pendingIncome = transactions
        .filter(t => t.type === 'income' && t.status === 'pending')
        .sort((a, b) => new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime());

    const next7DaysTotal = pendingIncome
        .filter(t => isBefore(new Date(t.due_date || t.created_at), addDays(new Date(), 7)))
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                    Contas a Receber
                </CardTitle>
                <CardDescription>
                    Mensalidades pendentes
                </CardDescription>

                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-emerald-200 font-medium">Previsto (7 dias)</span>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">{formatCurrency(next7DaysTotal)}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-0 min-h-0">
                <div className="space-y-3 mt-2">
                    {pendingIncome.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 text-sm">Nenhuma mensalidade pendente.</p>
                        </div>
                    ) : (
                        pendingIncome.map((t) => {
                            const dueDate = new Date(t.due_date || t.created_at);
                            const isOverdue = isBefore(dueDate, startOfDay(new Date()));
                            const isDueToday = isToday(dueDate);

                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        {t.category.startsWith('[') ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded w-fit mb-1 border border-zinc-700">
                                                    {t.category.match(/^\[(.*?)\]/)?.[1] || 'Mensalidade'}
                                                </span>
                                                <span className="font-medium text-zinc-200">{t.category.replace(/^\[.*?\]\s*/, '')}</span>
                                            </div>
                                        ) : (
                                            <span className="font-medium text-zinc-200">{t.category}</span>
                                        )}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={cn(
                                                "flex items-center gap-1 font-medium",
                                                isOverdue ? "text-red-500" : isDueToday ? "text-yellow-500" : "text-zinc-500"
                                            )}>
                                                <Calendar className="h-3 w-3" />
                                                {format(dueDate, 'dd/MM/yyyy')}
                                                {isOverdue && <span className="text-[10px] bg-red-500/10 px-1 rounded ml-1">ATRASADO</span>}
                                                {isDueToday && <span className="text-[10px] bg-yellow-500/10 px-1 rounded ml-1">HOJE</span>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-white mr-3">{formatCurrency(t.amount)}</span>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={cn(
                                                "h-8 w-8 p-0 rounded-full",
                                                !t.phone || !service ? "text-zinc-600 hover:text-zinc-500 cursor-not-allowed" : "text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                                            )}
                                            onClick={() => handleSendCharge(t)}
                                            disabled={sendingId === t.id}
                                            title={!service ? "WhatsApp não configurado" : !t.phone ? "Sem telefone" : "Enviar Cobrança WhatsApp"}
                                        >
                                            {sendingId === t.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MessageSquare className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full"
                                            onClick={() => onReceive(t)}
                                            title="Confirmar Recebimento"
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
