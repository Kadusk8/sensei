import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Swords, Loader2 } from 'lucide-react';
import { GraduationModal } from './GraduationModal';
import { cn } from '@/lib/utils'; // Assuming utils exists

interface Student {
    id: string;
    full_name: string;
    belt: string | null;
    degrees: number | null;
    status: string;
    created_at: string;
    // Add other fields if needed
}

interface StudentGraduationStatus {
    student: Student;
    classesAttended: number;
    lastPromotionDate: string;
    eligible: boolean;
    nextMilestone: string;
    progress: number; // 0-100
}

export function GraduationPanel() {
    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState<StudentGraduationStatus[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            // 1. Fetch Active Students
            const { data: studentsData } = await supabase
                .from('students')
                .select('*')
                .eq('status', 'active')
                .order('full_name');

            if (!studentsData) return;

            // Cast to formatted Student type to avoid 'never'
            const students = studentsData as unknown as Student[];
            const results: StudentGraduationStatus[] = [];

            // 2. Analyze each student (Parallel promises for speed)
            await Promise.all(students.map(async (student) => {
                // Get last graduation date
                const { data: lastGrad } = await supabase
                    .from('student_graduations')
                    .select('promotion_date')
                    .eq('student_id', student.id)
                    .order('promotion_date', { ascending: false })
                    .limit(1)
                    .single();

                // Fallback to student creation date if no graduation history
                // @ts-ignore
                const baselineDate = lastGrad?.promotion_date || student.created_at;

                // Count attendance since then
                const { count } = await supabase
                    .from('attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('student_id', student.id)
                    .eq('present', true)
                    .gte('date', baselineDate);

                const classes = count || 0;

                // 3. Define Rules (Simplified Logic)
                // White Belt: 30 classes per degree
                // Others: 50 classes per degree
                // Black: 100 classes (placeholder)

                const isWhiteBelt = (student.belt || '').toLowerCase().includes('branca');
                const requiredClasses = isWhiteBelt ? 30 : 50;

                const eligible = classes >= requiredClasses;
                const progress = Math.min((classes / requiredClasses) * 100, 100);

                // Determine next rank suggestion (simple logic)
                let nextRank = `${(student.degrees || 0) + 1}º Grau`;
                if ((student.degrees || 0) >= 4) {
                    nextRank = "Troca de Faixa"; // Generic message for belt promotion
                }

                results.push({
                    student,
                    classesAttended: classes,
                    lastPromotionDate: baselineDate,
                    eligible,
                    nextMilestone: nextRank,
                    progress
                });
            }));

            // Sort: Eligible first, then by progress desc
            results.sort((a, b) => {
                if (a.eligible && !b.eligible) return -1;
                if (!a.eligible && b.eligible) return 1;
                return b.progress - a.progress;
            });

            setCandidates(results);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, []);

    const handlePromote = (student: any) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-zinc-400">Analisando frequência dos alunos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl text-white">{candidates.filter(c => c.eligible).length}</CardTitle>
                        <CardDescription>Aptos a Graduar</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-2xl text-white">{candidates.length}</CardTitle>
                        <CardDescription>Total Analisado</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-4">
                {candidates.map((item) => (
                    <div
                        key={item.student.id}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            item.eligible
                                ? "bg-zinc-900/80 border-primary/30 hover:border-primary/50"
                                : "bg-zinc-900 border-zinc-800 opacity-75 hover:opacity-100"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <span className="font-bold text-zinc-500">{item.student.full_name.charAt(0)}</span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    {item.student.full_name}
                                    {item.eligible && <Badge className="bg-primary text-black hover:bg-primary/90">Apto</Badge>}
                                </h3>
                                <p className="text-sm text-zinc-400">
                                    Faixa {item.student.belt} • {item.student.degrees}º Grau
                                </p>
                                <div className="mt-2 w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full", item.eligible ? "bg-green-500" : "bg-zinc-600")}
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                    {item.classesAttended} aulas desde {new Date(item.lastPromotionDate).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <Button
                                onClick={() => handlePromote(item.student)}
                                variant={item.eligible ? "default" : "outline"}
                                className={item.eligible ? "bg-primary text-black hover:bg-primary/90" : "border-zinc-700 text-zinc-400"}
                            >
                                <Swords className="mr-2 h-4 w-4" />
                                Graduar
                            </Button>
                        </div>
                    </div>
                ))}

                {candidates.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        Nenhum aluno ativo encontrado.
                    </div>
                )}
            </div>

            {isModalOpen && selectedStudent && (
                <GraduationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    student={selectedStudent}
                    onSuccess={() => {
                        fetchCandidates();
                        setIsModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}
