// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { Check, X, Search, Calendar, Clock, UserCog, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Student {
    id: string;
    full_name: string;
    avatar_url: string | null;
    status: string;
}

interface Professor {
    id: string;
    full_name: string;
}

interface AttendanceSheetProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    className: string;
    date: Date;
    onSuccess: () => void;
}

export function AttendanceSheet({ isOpen, onClose, classId, className, date, onSuccess }: AttendanceSheetProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [selectedProfessorId, setSelectedProfessorId] = useState<string | null>(null);
    const [professorPresent, setProfessorPresent] = useState(false);
    const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && classId) {
            loadData();
        }
    }, [isOpen, classId, date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');

            // 1. Fetch Students, Professors, Attendance, and Class Session in parallel
            const [
                { data: studentsData },
                { data: professorsData },
                { data: attendanceData },
                { data: sessionData },
                { data: classData } // Get default professor
            ] = await Promise.all([
                supabase.from('students').select('id, full_name, avatar_url, status').eq('status', 'active').order('full_name'),
                supabase.from('professors').select('id, full_name').order('full_name'),
                supabase.from('attendance').select('student_id, present').eq('class_id', classId).eq('date', dateStr),
                supabase.from('class_sessions').select('professor_id, professor_present').eq('class_id', classId).eq('date', dateStr).maybeSingle(),
                supabase.from('classes').select('professor_id').eq('id', classId).single()
            ]);

            setStudents(studentsData || []);
            setProfessors(professorsData || []);

            // Set Present Students
            const initialPresence: Record<string, boolean> = {};
            attendanceData?.forEach((record) => {
                initialPresence[record.student_id] = record.present;
            });
            setPresenceMap(initialPresence);

            // Set Professor and professor presence
            if (sessionData?.professor_id) {
                setSelectedProfessorId(sessionData.professor_id);
                setProfessorPresent(sessionData.professor_present ?? false);
            } else if (classData?.professor_id) {
                setSelectedProfessorId(classData.professor_id);
                setProfessorPresent(false);
            }

        } catch (error) {
            console.error('Error loading data:', error);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const togglePresence = (studentId: string) => {
        setPresenceMap(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');

            // 1. Upsert Class Session (Professor + presence for the day)
            const { error: sessionError } = await supabase
                .from('class_sessions')
                .upsert({
                    class_id: classId,
                    date: dateStr,
                    professor_id: selectedProfessorId,
                    professor_present: professorPresent,
                    status: 'completed'
                }, { onConflict: 'class_id,date' });

            if (sessionError) throw sessionError;

            // 2. Upsert Attendance
            const upsertData = students.map(student => ({
                class_id: classId,
                student_id: student.id,
                date: dateStr,
                present: !!presenceMap[student.id]
            }));

            const { error: attendanceError } = await supabase
                .from('attendance')
                .upsert(upsertData, { onConflict: 'student_id,class_id,date' });

            if (attendanceError) throw attendanceError;

            alert('Chamada salva com sucesso! 🥋');
            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error saving:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const presentCount = Object.values(presenceMap).filter(Boolean).length;
    const selectedProfessorName = professors.find(p => p.id === selectedProfessorId)?.full_name;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900 z-10 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Check className="h-6 w-6 text-green-500" />
                                Lista de Chamada
                            </DialogTitle>
                            <DialogDescription className="text-zinc-400 mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(date, "dd 'de' MMMM", { locale: ptBR })}</span>
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {className}</span>
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                            <Badge variant="outline" className="text-lg py-1 px-3 border-zinc-700 bg-zinc-800">
                                {presentCount} Presentes
                            </Badge>
                        </div>
                    </div>

                    {/* Professor Selector + Presence Toggle */}
                    <div className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                        <UserCog className="h-5 w-5 text-zinc-400 shrink-0" />
                        <div className="flex-1">
                            <label className="text-xs text-zinc-500 font-medium ml-1">Professor Responsável</label>
                            <Select
                                value={selectedProfessorId || "unselected"}
                                onValueChange={(val) => setSelectedProfessorId(val === "unselected" ? null : val)}
                            >
                                <SelectTrigger className="h-9 border-none bg-transparent focus:ring-0 text-white font-medium p-0 pl-1">
                                    <SelectValue placeholder="Selecione um professor..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="unselected">Sem Professor</SelectItem>
                                    {professors.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Professor Presence Toggle */}
                        <div
                            onClick={() => setProfessorPresent(!professorPresent)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all shrink-0",
                                professorPresent
                                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                                    : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                            )}
                        >
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-medium">
                                {professorPresent ? 'Presente' : 'Ausente'}
                            </span>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-zinc-500"
                            placeholder="Buscar aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-black/20">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full bg-zinc-800 rounded-lg" />
                        ))
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {filteredStudents.map((student) => {
                                const isPresent = !!presenceMap[student.id];
                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => togglePresence(student.id)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200",
                                            isPresent
                                                ? "bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                                : "bg-zinc-800/50 border-zinc-800 hover:border-zinc-700"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center border transition-colors",
                                                isPresent ? "border-green-500 bg-green-500/20" : "border-zinc-700 bg-zinc-800"
                                            )}>
                                                {student.avatar_url ? (
                                                    <img src={student.avatar_url} alt={student.full_name} className="h-full w-full object-cover rounded-full" />
                                                ) : (
                                                    <span className={cn("font-bold text-sm", isPresent ? "text-green-500" : "text-zinc-500")}>
                                                        {student.full_name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn("font-medium", isPresent ? "text-white" : "text-zinc-400")}>
                                                {student.full_name}
                                            </span>
                                        </div>

                                        <div className={cn(
                                            "h-6 w-6 rounded-full flex items-center justify-center border",
                                            isPresent
                                                ? "bg-green-500 border-green-500 text-black"
                                                : "border-zinc-600"
                                        )}>
                                            {isPresent && <Check className="h-4 w-4" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-zinc-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={loading || saving} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
                        {saving ? 'Salvando...' : 'Confirmar Chamada'}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
