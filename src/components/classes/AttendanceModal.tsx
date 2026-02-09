// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: any; // Using any for simplicity in rapid dev, ideally typed
    date: Date;
    onSuccess: () => void;
    onEditClass: () => void;
}

export function AttendanceModal({ isOpen, onClose, classData, date, onSuccess, onEditClass }: AttendanceModalProps) {
    const [loading, setLoading] = useState(false);
    const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'completed' | 'canceled'>('scheduled');
    const [overrideProfessorId, setOverrideProfessorId] = useState<string>('');
    const [professors, setProfessors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]); // All active students
    const [attendees, setAttendees] = useState<string[]>([]); // IDs of students present
    const [loadingData, setLoadingData] = useState(true);
    const [notes, setNotes] = useState('');

    const formattedDate = format(date, 'yyyy-MM-dd');
    const displayDate = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen, classData, formattedDate]);

    async function fetchInitialData() {
        setLoadingData(true);
        try {
            // 1. Fetch Professors for override dropdown
            const { data: profs } = await supabase.from('professors').select('*');
            if (profs) setProfessors(profs);

            // 2. Fetch Session Data if exists
            const { data: session } = await supabase
                .from('class_sessions')
                .select('*')
                .eq('class_id', classData.id)
                .eq('date', formattedDate)
                .single();

            if (session) {
                setSessionStatus(session.status);
                setOverrideProfessorId(session.professor_id || '');
                setNotes(session.notes || '');
            } else {
                setSessionStatus('scheduled');
                setOverrideProfessorId('');
                setNotes('');
            }

            // 3. Fetch Attendance (Students Present) works even if session record doesn't exist yet (though usually tied)
            // But we can just use the attendance table for raw links
            const { data: attendance } = await supabase
                .from('attendance')
                .select('student_id')
                .eq('class_id', classData.id)
                .eq('date', formattedDate)
                .eq('present', true);

            if (attendance) {
                setAttendees(attendance.map(a => a.student_id));
            } else {
                setAttendees([]);
            }

            // 4. Fetch All Active Students for the "Add" list
            const { data: allStudents } = await supabase
                .from('students')
                .select('*')
                .eq('status', 'active')
                .order('full_name');

            if (allStudents) setStudents(allStudents);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoadingData(false);
        }
    }

    const handleSaveSession = async () => {
        setLoading(true);
        try {
            // Upsert Session
            const { error: sessionError } = await supabase.from('class_sessions').upsert({
                class_id: classData.id,
                date: formattedDate,
                professor_id: overrideProfessorId || null,
                status: sessionStatus,
                notes: notes,
            }, { onConflict: 'class_id, date' });

            if (sessionError) throw sessionError;

            // Handle Attendance Sync (Simple approach: delete all for day/class and re-insert checks)
            // Or smarter: find diff. For MVP, delete + insert is inefficient but safe.
            // Better: Upsert entries. BUT unchecking is hard.
            // Let's do: Delete All for this class/date -> Insert Selected.

            await supabase.from('attendance').delete().eq('class_id', classData.id).eq('date', formattedDate);

            if (attendees.length > 0) {
                const attendanceRecords = attendees.map(studentId => ({
                    class_id: classData.id,
                    student_id: studentId,
                    date: formattedDate,
                    present: true
                }));
                const { error: attError } = await supabase.from('attendance').insert(attendanceRecords);
                if (attError) throw attError;
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving session:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAttendance = (studentId: string) => {
        setAttendees(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">{classData.name} - {classData.schedule_time}</DialogTitle>
                        <Button variant="outline" size="sm" onClick={onEditClass} className="text-xs border-zinc-700">
                            Editar Turma
                        </Button>
                    </div>
                    <p className="text-zinc-400 capitalize">{displayDate}</p>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-6">
                        {/* Session Control */}
                        <div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 space-y-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-primary" /> Controle da Aula
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Professor (Hoje)</Label>
                                    <Select value={overrideProfessorId || "default"} onValueChange={(val) => setOverrideProfessorId(val === "default" ? "" : val)}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-600">
                                            <SelectValue placeholder={classData.professor?.full_name || "Selecione"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                            <SelectItem value="default" className="text-zinc-400 italic">
                                                {classData.professor?.full_name || "Sem Professor Padrão"} (Padrão)
                                            </SelectItem>
                                            {professors.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={sessionStatus} onValueChange={(val: any) => setSessionStatus(val)}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                            <SelectItem value="scheduled">Agendada</SelectItem>
                                            <SelectItem value="completed" className="text-green-500">Concluída</SelectItem>
                                            <SelectItem value="canceled" className="text-red-500">Cancelada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Attendance List */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Lista de Chamada ({attendees.length} presentes)</Label>
                                <Badge variant="outline" className="text-zinc-400">{students.length} Total</Badge>
                            </div>

                            <div className="h-[200px] overflow-y-auto rounded-md border border-zinc-700 bg-zinc-800/30 p-2 space-y-1">
                                {students.map(student => {
                                    const isPresent = attendees.includes(student.id);
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => toggleAttendance(student.id)}
                                            className={`
                                                flex items-center justify-between p-2 rounded cursor-pointer transition-colors
                                                ${isPresent ? 'bg-green-500/20 border border-green-500/30' : 'hover:bg-zinc-800 border border-transparent'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${isPresent ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-400'}
                                                `}>
                                                    {student.avatar_url ? (
                                                        <img src={student.avatar_url} className="w-full h-full object-cover rounded-full" />
                                                    ) : student.full_name.charAt(0)}
                                                </div>
                                                <span className={isPresent ? 'text-white font-medium' : 'text-zinc-400'}>
                                                    {student.full_name}
                                                </span>
                                            </div>
                                            {isPresent && <UserCheck className="h-4 w-4 text-green-500" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleSaveSession} disabled={loading || loadingData}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar e Confirmar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
