// @ts-nocheck
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { Loader2, Swords } from 'lucide-react';
// import { toast } from 'sonner'; // Assuming sonner or use alert

interface GraduationModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onSuccess: () => void;
}

export function GraduationModal({ isOpen, onClose, student, onSuccess }: GraduationModalProps) {
    const [loading, setLoading] = useState(false);
    const [belt, setBelt] = useState(student?.belt || 'Branca');
    const [degrees, setDegrees] = useState(student?.degrees || 0);
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Insert into history
// @ts-ignore
            const { error: historyError } = await supabase.from('student_graduations').insert({
                student_id: student.id,
                belt: belt,
                degrees: degrees,
                notes: notes || null,
                promotion_date: new Date().toISOString()
            });

            if (historyError) throw historyError;

            // 2. Update student current belt
// @ts-ignore
            const { error: updateError } = await supabase.from('students').update({
                belt: belt,
                degrees: degrees
            }).eq('id', student.id);

            if (updateError) throw updateError;

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error promoting student:', error);
            alert('Erro ao graduar aluno: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-primary" />
                        Graduar Aluno
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <p className="text-sm text-zinc-400">
                        Promovendo <span className="text-white font-medium">{student?.full_name}</span>
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Faixa Atual: {student?.belt || 'Branca'} ({student?.degrees || 0}º Grau)
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nova Faixa</Label>
                            <Select value={belt} onValueChange={setBelt}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="Branca">Branca</SelectItem>
                                    <SelectItem value="Cinza">Cinza</SelectItem>
                                    <SelectItem value="Amarela">Amarela</SelectItem>
                                    <SelectItem value="Laranja">Laranja</SelectItem>
                                    <SelectItem value="Verde">Verde</SelectItem>
                                    <SelectItem value="Azul">Azul</SelectItem>
                                    <SelectItem value="Roxa">Roxa</SelectItem>
                                    <SelectItem value="Marrom">Marrom</SelectItem>
                                    <SelectItem value="Preta">Preta</SelectItem>
                                    <SelectItem value="Vermelha">Vermelha</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Novos Graus</Label>
                            <Select value={degrees.toString()} onValueChange={(v) => setDegrees(parseInt(v))}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="0">0 (Lisa)</SelectItem>
                                    <SelectItem value="1">1º Grau</SelectItem>
                                    <SelectItem value="2">2º Grau</SelectItem>
                                    <SelectItem value="3">3º Grau</SelectItem>
                                    <SelectItem value="4">4º Grau</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações (Opcional)</Label>
                        <Textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
                            placeholder="Ex: Mandou bem no exame, técnica apurada."
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} className="hover:bg-zinc-800 text-zinc-400">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary text-black hover:bg-primary/90">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Graduação
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
