import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Send, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format, differenceInDays, startOfDay } from 'date-fns';
import { EvolutionService } from '@/services/whatsapp';
import type { Database } from '@/types/database';

type Transaction = Database['public']['Tables']['transactions']['Row'] & { phone?: string };

interface BillingAutomationPanelProps {
    transactions: Transaction[];
    onRefresh?: () => void;
}

interface BillingCandidate {
    transaction: Transaction;
    type: 'preventive' | 'overdue';
    daysDiff: number;
    message: string;
    selected: boolean;
    status: 'pending' | 'sending' | 'sent' | 'error';
}

export function BillingAutomationPanel({ transactions }: BillingAutomationPanelProps) {
    const [candidates, setCandidates] = useState<BillingCandidate[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [service, setService] = useState<EvolutionService | null>(null);
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

    useEffect(() => {
        identifyCandidates();
    }, [transactions]);

    const identifyCandidates = () => {
        const today = startOfDay(new Date());
        const newCandidates: BillingCandidate[] = [];

        transactions.forEach(t => {
            if (t.type !== 'income' || (t.status !== 'paid' && t.status !== 'pending')) return;
            // Only pending
            if (t.status === 'paid') return;
            if (!t.phone) return; // Can't message without phone

            const dueDate = t.due_date ? new Date(t.due_date) : new Date(t.created_at);
            const diff = differenceInDays(today, startOfDay(dueDate));

            // Logic:
            // 1. Preventive: 1 day BEFORE due date (diff === -1)
            // 2. Reactive: Every 2 days AFTER due date (diff > 0 && diff % 2 === 0) 

            let type: 'preventive' | 'overdue' | null = null;
            let message = '';
            const name = t.category.match(/^\[(.*?)\]\s*(.*)/)?.[2] || 'Aluno';
            const value = formatCurrency(t.amount);

            if (diff === -1) {
                // Tomorrow is due date
                type = 'preventive';
                message = `Olá ${name}! Lembra que sua mensalidade de ${value} vence amanhã? 🥋`;
            } else if (diff > 0 && diff % 2 === 0) {
                // Overdue
                type = 'overdue';
                message = `Olá ${name}. Consta em nosso sistema uma pendência de ${value} (${diff} dias de atraso). Pode nos enviar o comprovante?`;
            }

            if (type) {
                newCandidates.push({
                    transaction: t,
                    type,
                    daysDiff: Math.abs(diff),
                    message,
                    selected: true,
                    status: 'pending'
                });
            }
        });

        setCandidates(newCandidates);
    };

    const handleProcess = async () => {
        if (!service) return alert('WhatsApp não configurado.');

        const toProcess = candidates.filter(c => c.selected && c.status === 'pending');
        if (toProcess.length === 0) return;

        if (!confirm(`Confirmar envio de ${toProcess.length} mensagens?`)) return;

        setIsProcessing(true);

        // Process sequentially
        for (let i = 0; i < toProcess.length; i++) {
            const candidate = toProcess[i];

            setCandidates(prev => prev.map(c =>
                c.transaction.id === candidate.transaction.id ? { ...c, status: 'sending' } : c
            ));

            try {
                let phone = candidate.transaction.phone!.replace(/\D/g, '');
                if (phone.length <= 11) phone = '55' + phone;

                await service.sendText(instanceName, phone, candidate.message);

                setCandidates(prev => prev.map(c =>
                    c.transaction.id === candidate.transaction.id ? { ...c, status: 'sent' } : c
                ));
            } catch (e) {
                console.error(e);
                setCandidates(prev => prev.map(c =>
                    c.transaction.id === candidate.transaction.id ? { ...c, status: 'error' } : c
                ));
            }

            await new Promise(r => setTimeout(r, 1500));
        }

        setIsProcessing(false);
        alert('Processamento concluído!');
    };

    const toggleSelect = (id: string) => {
        if (isProcessing) return;
        setCandidates(prev => prev.map(c =>
            c.transaction.id === id ? { ...c, selected: !c.selected } : c
        ));
    };

    // if (candidates.length === 0) return null; // REMOVED to show panel always

    const preventiveCount = candidates.filter(c => c.type === 'preventive').length;
    const overdueCount = candidates.filter(c => c.type === 'overdue').length;

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 mb-6 animate-in slide-in-from-top-5">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-white flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                            Automação de Cobranças
                        </CardTitle>
                        <CardDescription>
                            Disparos sugeridos para hoje ({format(new Date(), 'dd/MM')})
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {preventiveCount > 0 && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/50">
                                {preventiveCount} Preventivos
                            </Badge>
                        )}
                        {overdueCount > 0 && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/50">
                                {overdueCount} Em Atraso
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {candidates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[100px] text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 mb-2 text-emerald-500/50" />
                        <p className="text-sm">Nenhuma cobrança automática pendente para hoje.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-[200px] overflow-y-auto rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
                            <div className="space-y-3">
                                {candidates.map((c) => (
                                    <div key={c.transaction.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
                                        <Checkbox
                                            checked={c.selected}
                                            onChange={() => toggleSelect(c.transaction.id)}
                                            disabled={c.status !== 'pending' || isProcessing}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-zinc-200">
                                                    {c.transaction.category.replace(/^\[.*?\]\s*/, '')}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-zinc-500 font-mono">
                                                        {formatCurrency(c.transaction.amount)}
                                                    </span>
                                                    {c.status === 'sent' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                    {c.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                    {c.status === 'sending' && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                                                </div>
                                            </div>
                                            <p className="text-xs text-zinc-500 line-clamp-1 italic">
                                                "{c.message}"
                                            </p>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-zinc-800">
                                                    {c.daysDiff === 0 ? 'Vence hoje' : c.type === 'preventive' ? 'Vence amanhã' : `${c.daysDiff} dias atrasado`}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <Button
                                onClick={handleProcess}
                                disabled={isProcessing || candidates.filter(c => c.selected && c.status === 'pending').length === 0}
                                className="bg-primary text-black hover:bg-primary/90"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Processar Envios
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
