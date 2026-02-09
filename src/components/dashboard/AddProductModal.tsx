// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    productToEdit?: any | null;
}

export function AddProductModal({ isOpen, onClose, onSuccess, productToEdit }: AddProductModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock_quantity, setStockQuantity] = useState('');
    const [image_url, setImageUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setName(productToEdit.name);
                setPrice(productToEdit.price.toString());
                setStockQuantity(productToEdit.stock_quantity?.toString() || '');
                setImageUrl(productToEdit.image_url || '');
            } else {
                setName('');
                setPrice('');
                setStockQuantity('');
                setImageUrl('');
            }
        }
    }, [isOpen, productToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (productToEdit) {
                const { error } = await supabase.from('products').update({
                    name,
                    price: parseFloat(price),
                    stock_quantity: parseInt(stock_quantity) || 0,
                    image_url: image_url || null,
                }).eq('id', productToEdit.id);

                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert([
                    {
                        name,
                        price: parseFloat(price),
                        stock_quantity: parseInt(stock_quantity) || 0,
                        image_url: image_url || null,
                    }
                ]);

                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>{productToEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome do Produto</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Luva de Boxe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Preço (R$)</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Estoque Inicial</Label>
                            <Input
                                id="stock"
                                type="number"
                                placeholder="0"
                                value={stock_quantity}
                                onChange={(e) => setStockQuantity(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">URL da Imagem (Opcional)</Label>
                        <Input
                            id="image"
                            placeholder="https://..."
                            value={image_url}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !name || !price}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {productToEdit ? 'Salvar Alterações' : 'Salvar Produto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
