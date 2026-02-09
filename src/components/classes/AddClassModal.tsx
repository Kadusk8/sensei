// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface AddClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    classToEdit?: any | null;
}

const DAYS_OF_WEEK = [
    { id: 'Mon', label: 'Segunda' },
    { id: 'Tue', label: 'Terça' },
    { id: 'Wed', label: 'Quarta' },
    { id: 'Thu', label: 'Quinta' },
    { id: 'Fri', label: 'Sexta' },
    { id: 'Sat', label: 'Sábado' },
    { id: 'Sun', label: 'Domingo' },
];

export function AddClassModal({ isOpen, onClose, onSuccess, classToEdit }: AddClassModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [schedule_time, setScheduleTime] = useState('');
    const [professor_id, setProfessorId] = useState<string>('');
    const [days, setDays] = useState<string[]>([]);
    const [professors, setProfessors] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchProfessors();
            if (classToEdit) {
                setName(classToEdit.name);
                setScheduleTime(classToEdit.schedule_time);
                setProfessorId(classToEdit.professor_id || '');
                setDays(classToEdit.days_of_week || []);
            } else {
                setName('');
                setScheduleTime('');
                setProfessorId('');
                setDays([]);
            }
        }
    }, [isOpen, classToEdit]);

    async function fetchProfessors() {
        const { data } = await supabase.from('professors').select('*');
        if (data) setProfessors(data);
    }

    const toggleDay = (dayId: string) => {
        setDays(prev =>
            prev.includes(dayId)
                ? prev.filter(d => d !== dayId)
                : [...prev, dayId]
        );
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (classToEdit) {
                const { error } = await supabase.from('classes').update({
                    name,
                    schedule_time,
                    professor_id: professor_id || null,
                    days_of_week: days
                }).eq('id', classToEdit.id);

                if (error) throw error;
            } else {
                const { error } = await supabase.from('classes').insert([
                    {
                        name,
                        schedule_time,
                        professor_id: professor_id || null,
                        days_of_week: days
                    }
                ]);

                if (error) throw error;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving class:', error);
            alert('Error adding/updating class. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>{classToEdit ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Turma</Label>
                        <Input
                            id="name"
                            placeholder="Ex: Boxe - Avançado"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Horário</Label>
                            <Input
                                id="time"
                                type="time"
                                value={schedule_time}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="professor">Professor</Label>
                            <Select value={professor_id} onValueChange={setProfessorId}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    {professors.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Dias da Semana</Label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <div key={day.id} className="flex items-center space-x-2 border border-zinc-800 rounded-md p-2 bg-zinc-950/50">
                                    <Checkbox
                                        id={day.id}
                                        checked={days.includes(day.id)}
                                        onChange={() => toggleDay(day.id)}
                                    />
                                    <Label htmlFor={day.id} className="text-xs cursor-pointer">{day.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || days.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {classToEdit ? 'Salvar Alterações' : 'Salvar Turma'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
