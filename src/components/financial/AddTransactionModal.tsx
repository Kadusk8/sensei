// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { Loader2, Repeat } from 'lucide-react';
import { format } from 'date-fns';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transactionToEdit?: any | null;
}

export function AddTransactionModal({ isOpen, onClose, onSuccess, transactionToEdit }: AddTransactionModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: '',
        smartCategory: 'Outros',
        amount: '',
        type: 'expense',
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
    });

    const [isRecurring, setIsRecurring] = useState(false);
    const [repeatCount, setRepeatCount] = useState('12');
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('id, name').order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isOpen && transactionToEdit) {
            const match = transactionToEdit.category.match(/^\[(.*?)\]\s*(.*)/);
            const smartCat = match ? match[1] : 'Outros';
            const desc = match ? match[2] : transactionToEdit.category;

            setFormData({
                description: desc,
                smartCategory: smartCat,
                amount: transactionToEdit.amount.toString(),
                type: transactionToEdit.type,
                status: transactionToEdit.status,
                date: new Date(transactionToEdit.due_date || transactionToEdit.created_at).toISOString().split('T')[0]
            });
            setIsRecurring(false); // Disable recurring for edit mode for now
        } else if (isOpen) {
            setFormData({
                description: '',
                smartCategory: 'Outros',
                amount: '',
                type: 'expense',
                status: 'pending',
                date: new Date().toISOString().split('T')[0]
            });
            setIsRecurring(false);
            setRepeatCount('12');
        }
    }, [isOpen, transactionToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Format category as [Category] Description for "Smart Categories" feature
            const finalCategory = `[${formData.smartCategory}] ${formData.description}`;

            if (transactionToEdit) {
                const { error } = await supabase.from('transactions').update({
                    category: finalCategory,
                    amount: parseFloat(formData.amount),
                    type: formData.type,
                    status: formData.status,
                    due_date: formData.date
                }).eq('id', transactionToEdit.id);
                if (error) throw error;
            } else {
                if (isRecurring) {
                    // Create Fixed Expense Template
                    const dueDay = parseInt(formData.date.split('-')[2]);
                    const { error } = await supabase.from('fixed_expenses').insert([{
                        category: formData.smartCategory,
                        description: formData.description,
                        amount: parseFloat(formData.amount),
                        due_day: dueDay,
                        active: true
                    }]);
                    if (error) throw error;
                } else {
                    // Create Single Transaction
                    const { error } = await supabase.from('transactions').insert([{
                        category: finalCategory,
                        amount: parseFloat(formData.amount),
                        type: formData.type,
                        status: formData.status,
                        created_at: new Date(formData.date + 'T12:00:00').toISOString(),
                        due_date: formData.date
                    }]);
                    if (error) throw error;
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving transaction:', error);
            alert('Erro ao salvar transação: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{transactionToEdit ? 'Editar Movimentação' : 'Nova Movimentação'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Categoria (Inteligente)</Label>
                        <Select
                            value={formData.smartCategory}
                            onValueChange={(val) => setFormData({ ...formData, smartCategory: val })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                                <SelectItem value="Outros">Outros</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição Detalhada</Label>
                        <Input
                            required
                            placeholder="Ex: Conta de Luz referente a Janeiro"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Vencimento</Label>
                            <Input
                                required
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="expense">Despesa (Saída)</SelectItem>
                                    <SelectItem value="income">Receita (Entrada)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData({ ...formData, status: val })}
                            >
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="pending">Pendente</SelectItem>
                                    <SelectItem value="paid">Pago / Recebido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {!transactionToEdit && (
                        <div className="space-y-4 pt-2 border-t border-zinc-800">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="recurring"
                                    checked={isRecurring}
                                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                                    className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                                />
                                <Label htmlFor="recurring" className="text-white flex items-center gap-2 cursor-pointer">
                                    <Repeat className="h-4 w-4 text-zinc-400" />
                                    Despesa Fixa (Recorrente)
                                </Label>
                            </div>

                            {isRecurring && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 pt-2">
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm text-blue-200">
                                        Esta despesa aparecerá automaticamente todo mês no painel como "Pendente" no dia <strong>{format(new Date(formData.date + 'T12:00:00'), 'dd')}</strong>.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-zinc-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-black">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isRecurring ? `Salvar (${repeatCount}x)` : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
