import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AddTransactionModal } from '@/components/financial/AddTransactionModal';

interface StudentFinancialModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
}

export function StudentFinancialModal({ isOpen, onClose, student }: StudentFinancialModalProps) {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            fetchTransactions();
        }
    }, [isOpen, student]);

    const fetchTransactions = async () => {
        if (!student) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('related_user_id', student.id)
                .order('due_date', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        }
    };

    const markAsPaid = async (transaction: any) => {
        if (!confirm('Confirmar pagamento?')) return;
        try {
            const { error } = await (supabase as any)
                .from('transactions')
                .update({ status: 'paid' })
                .eq('id', transaction.id);

            if (error) throw error;
            fetchTransactions();
        } catch (error) {
            alert('Erro ao atualizar status.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader className="flex flex-row items-center justify-between pr-4">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-emerald-500" />
                        Financeiro: {student?.full_name}
                    </DialogTitle>
                    <Button
                        size="sm"
                        onClick={() => setIsAddTransactionOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Cobrança
                    </Button>
                </DialogHeader>

                <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                            Nenhuma movimentação encontrada para este aluno.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(transaction => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 transition-all"
                                >
                                    <div className="space-y-1">
                                        <div className="font-medium text-white">{transaction.category}</div>
                                        <div className="text-xs text-zinc-400 capitalize">
                                            Vencimento: {format(new Date(transaction.due_date || transaction.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {transaction.type === 'income' ? '+ ' : '- '}
                                                R$ {transaction.amount.toFixed(2)}
                                            </div>
                                            <Badge variant="outline" className={`mt-1 capitalize ${getStatusColor(transaction.status)}`}>
                                                {transaction.status === 'paid' ? 'Pago' : transaction.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                                            </Badge>
                                        </div>

                                        {transaction.status !== 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                onClick={() => markAsPaid(transaction)}
                                                title="Marcar como pago"
                                            >
                                                ✓
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <AddTransactionModal
                    isOpen={isAddTransactionOpen}
                    onClose={() => setIsAddTransactionOpen(false)}
                    initialStudentId={student?.id}
                    initialDescription={`Mensalidade - ${student?.full_name}`}
                    onSuccess={() => {
                        fetchTransactions();
                        setIsAddTransactionOpen(false);
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
