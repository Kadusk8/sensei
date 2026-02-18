// @ts-nocheck
import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AddClassModal } from '@/components/classes/AddClassModal';
import { Plus, ShieldCheck, UserCog } from 'lucide-react';

export function Classes() {
    const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
    const [classes, setClasses] = React.useState<any[]>([]);
    const [students, setStudents] = React.useState<any[]>([]);
    const [professors, setProfessors] = React.useState<any[]>([]);
    const [attendance, setAttendance] = React.useState<Record<string, boolean>>({});
    const [selectedProfessorId, setSelectedProfessorId] = React.useState<string | null>(null);
    const [professorPresent, setProfessorPresent] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [isAddClassModalOpen, setIsAddClassModalOpen] = React.useState(false);

    React.useEffect(() => {
        fetchClasses();
        fetchStudents();
        fetchProfessors();
    }, []);

    React.useEffect(() => {
        if (selectedClassId && selectedDate) {
            fetchAttendance();
        }
    }, [selectedClassId, selectedDate]);

    async function fetchClasses() {
        const { data } = await supabase.from('classes').select('*, professor:professors(*)').order('name');
        if (data) setClasses(data);
    }

    async function fetchStudents() {
        const { data } = await supabase.from('students').select('*').eq('status', 'active').order('full_name');
        if (data) setStudents(data);
    }

    async function fetchProfessors() {
        const { data } = await supabase.from('professors').select('id, full_name').order('full_name');
        if (data) setProfessors(data);
    }

    async function fetchAttendance() {
        if (!selectedClassId) return;
        setLoading(true);
        try {
            // Fetch attendance
            const { data, error } = await supabase
                .from('attendance')
                .select('student_id, present')
                .eq('class_id', selectedClassId)
                .eq('date', selectedDate);

            if (error) throw error;

            const existingmap: Record<string, boolean> = {};
            data?.forEach((record: any) => {
                existingmap[record.student_id] = record.present;
            });
            setAttendance(existingmap);

            // Fetch session (professor info)
            const { data: sessionData } = await supabase
                .from('class_sessions')
                .select('professor_id, professor_present')
                .eq('class_id', selectedClassId)
                .eq('date', selectedDate)
                .maybeSingle();

            if (sessionData) {
                setSelectedProfessorId(sessionData.professor_id);
                setProfessorPresent(sessionData.professor_present ?? false);
            } else {
                // Fall back to default class professor
                const cls = classes.find(c => c.id === selectedClassId);
                setSelectedProfessorId(cls?.professor_id || null);
                setProfessorPresent(false);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    }

    const togglePresence = (studentId: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: !prev[studentId]
        }));
    };

    const handleSave = async () => {
        if (!selectedClassId) return;
        setSaving(true);
        try {
            // 1. Upsert class session (professor + presence)
            const { error: sessionError } = await supabase
                .from('class_sessions')
                .upsert({
                    class_id: selectedClassId,
                    date: selectedDate,
                    professor_id: selectedProfessorId,
                    professor_present: professorPresent,
                    status: 'completed'
                }, { onConflict: 'class_id,date' });

            if (sessionError) throw sessionError;

            // 2. Delete existing attendance
            await supabase
                .from('attendance')
                .delete()
                .eq('class_id', selectedClassId)
                .eq('date', selectedDate);

            // 3. Insert new attendance
            const updates = students.map(student => ({
                student_id: student.id,
                class_id: selectedClassId,
                date: selectedDate,
                present: attendance[student.id] || false
            }));

            const { error } = await (supabase.from('attendance') as any).insert(updates);

            if (error) throw error;
            alert('Chamada salva com sucesso!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar chamada.');
        } finally {
            setSaving(false);
        }
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Gestão de Presença</h2>
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white"
                    />
                    <Button onClick={() => setIsAddClassModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Plus size={16} />
                        Nova Turma
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
                {/* Class Selection */}
                <div className="md:col-span-1 space-y-2">
                    <h3 className="text-lg font-medium text-zinc-400">Turmas</h3>
                    <div className="flex flex-col gap-2">
                        {classes.map(cls => (
                            <Button
                                key={cls.id}
                                variant={selectedClassId === cls.id ? "default" : "outline"}
                                className={`justify-start ${selectedClassId === cls.id ? 'bg-primary text-primary-foreground' : 'text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}
                                onClick={() => setSelectedClassId(cls.id)}
                            >
                                {cls.name}
                                <span className="ml-auto text-xs opacity-50">{cls.schedule_time}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Student List */}
                <div className="md:col-span-3 bg-zinc-900/50 rounded-lg border border-zinc-800 p-6">
                    {!selectedClassId ? (
                        <div className="flex items-center justify-center h-full text-zinc-500">
                            Selecione uma turma para realizar a chamada
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                                <h3 className="text-xl font-bold text-white">
                                    Lista de Alunos - {selectedClass?.name}
                                </h3>
                                <div className="text-sm text-zinc-400">
                                    {Object.values(attendance).filter(Boolean).length} Presentes
                                </div>
                            </div>

                            {/* Professor Selector + Presence */}
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
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all shrink-0
                                        ${professorPresent
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600'}
                                    `}
                                >
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                        {professorPresent ? 'Presente' : 'Ausente'}
                                    </span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="py-8 text-center text-zinc-500">Carregando chamada...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {students.map(student => (
                                        <div
                                            key={student.id}
                                            onClick={() => togglePresence(student.id)}
                                            className={`
                                                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all
                                                ${attendance[student.id]
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                                    ${attendance[student.id] ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'}
                                                `}>
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <span className={attendance[student.id] ? 'text-white' : 'text-zinc-400'}>
                                                    {student.full_name}
                                                </span>
                                            </div>
                                            {attendance[student.id] && (
                                                <span className="text-emerald-500 text-sm font-medium">Presente</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-zinc-800">
                                <Button
                                    size="lg"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]"
                                >
                                    {saving ? 'Salvando...' : 'Salvar Chamada'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <AddClassModal
                isOpen={isAddClassModalOpen}
                onClose={() => setIsAddClassModalOpen(false)}
                onSuccess={() => {
                    fetchClasses();
                    setIsAddClassModalOpen(false);
                }}
            />
        </div>
    );
}
