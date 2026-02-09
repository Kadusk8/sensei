// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number;
    weekly_limit: number;
}

interface AddPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    planToEdit?: Plan | null;
}

export function AddPlanModal({ isOpen, onClose, onSuccess, planToEdit }: AddPlanModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        weekly_limit: ''
    });

    useEffect(() => {
        if (planToEdit) {
            setFormData({
                name: planToEdit.name,
                price: planToEdit.price.toString(),
                weekly_limit: planToEdit.weekly_limit.toString()
            });
        } else {
            setFormData({
                name: '',
                price: '',
                weekly_limit: ''
            });
        }
    }, [planToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const planData = {
                name: formData.name,
                price: parseFloat(formData.price),
                weekly_limit: parseInt(formData.weekly_limit)
            };

            if (planToEdit) {
                const { error } = await supabase
                    .from('plans')
                    .update(planData)
                    .eq('id', planToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plans')
                    .insert([planData]);
                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving plan:', error);
            alert('Erro ao salvar plano. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{planToEdit ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Configure os detalhes do plano de assinatura.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Plano</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Mensal Gold"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço Mensal (R$)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0.00"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="limit">Aulas por Semana</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={formData.weekly_limit}
                                onChange={(e) => setFormData({ ...formData, weekly_limit: e.target.value })}
                                placeholder="Ex: 3"
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {planToEdit ? 'Salvar Alterações' : 'Criar Plano'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
