// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('both');

    useEffect(() => {
        if (isOpen) {
            setName('');
            setType('both');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.from('categories').insert([
                { name, type }
            ]);

            if (error) throw error;

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding category:', error);
            alert('Erro ao adicionar categoria: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Categoria</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nome da Categoria</Label>
                        <Input
                            required
                            placeholder="Ex: Transporte, Alimentação..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                            value={type}
                            onValueChange={setType}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectItem value="income">Receita (Entrada)</SelectItem>
                                <SelectItem value="expense">Despesa (Saída)</SelectItem>
                                <SelectItem value="both">Ambos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-zinc-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-black">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
