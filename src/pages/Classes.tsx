import React from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function Classes() {
    const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = React.useState<string | null>(null);
    const [classes, setClasses] = React.useState<any[]>([]);
    const [students, setStudents] = React.useState<any[]>([]);
    const [attendance, setAttendance] = React.useState<Record<string, boolean>>({});
    const [loading, setLoading] = React.useState(false);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    React.useEffect(() => {
        if (selectedClassId && selectedDate) {
            fetchAttendance();
        }
    }, [selectedClassId, selectedDate]);

    async function fetchClasses() {
        const { data } = await supabase.from('classes').select('*').order('name');
        if (data) setClasses(data);
    }

    async function fetchStudents() {
        const { data } = await supabase.from('students').select('*').eq('status', 'active').order('full_name');
        if (data) setStudents(data);
    }

    async function fetchAttendance() {
        if (!selectedClassId) return;
        setLoading(true);
        try {
            // First validation: check if 'attendance' table exists via a simple call (already implied)
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
            // Upsert records
            const updates = students.map(student => ({
                student_id: student.id,
                class_id: selectedClassId,
                date: selectedDate,
                present: attendance[student.id] || false
            }));

            // We need to handle upsert carefully. 
            // supabase .upsert needs a unique constraint on (student_id, class_id, date) ideally.
            // Assuming table doesn't have unique constraint, we might need to delete and insert for this day/class?
            // "safe" way without unique constraint is delete existing for this class/day and insert new.

            // Delete existing
            await supabase
                .from('attendance')
                .delete()
                .eq('class_id', selectedClassId)
                .eq('date', selectedDate);

            // Insert new (only present ones? or all? usually all to track absence, but let's track all)
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
                                    Lista de Alunos - {classes.find(c => c.id === selectedClassId)?.name}
                                </h3>
                                <div className="text-sm text-zinc-400">
                                    {Object.values(attendance).filter(Boolean).length} Presentes
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
        </div>
    );
}
