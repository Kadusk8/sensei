// @ts-nocheck
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddUserModal({ isOpen, onClose, onSuccess }: AddUserModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role: 'secretary' as 'admin' | 'professor' | 'secretary'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Call the custom SQL function we created
            const { data, error } = await supabase.rpc('create_user_with_role', {
                email: formData.email,
                password: formData.password,
                user_name: formData.full_name,
                user_role: formData.role
            });

            if (error) throw error;

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                full_name: '',
                email: '',
                password: '',
                role: 'secretary'
            });
            alert('Usuário criado com sucesso!');
        } catch (error: any) {
            console.error('Error creating user:', error);
            setError(error.message || 'Erro ao criar usuário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Usuário</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Crie um login para Secretária, Professor ou Admin.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email de Acesso</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Senha Temporária</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-zinc-800 border-zinc-700"
                            minLength={6}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Função / Cargo</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                        >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                                <SelectItem value="secretary">Secretária (Recepção/Vendas)</SelectItem>
                                <SelectItem value="professor">Professor (Aulas/Alunos)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-zinc-800">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Criar Login
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
