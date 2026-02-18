import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { Search, Filter, Swords, Wallet, MessageSquare, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudents } from '@/hooks/useStudents';
import { AddStudentModal as EditModalWrapper } from './AddStudentModal';
import { GraduationModal } from './GraduationModal';
import { StudentFinancialModal } from './StudentFinancialModal';
import { AsaasSubscriptionModal } from './AsaasSubscriptionModal';

import { EvolutionService } from '@/services/whatsapp';
import { supabase } from '@/lib/supabase';


export function StudentList() {
    const { students, loading, error, refetch } = useStudents();
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // WhatsApp State
    const [service, setService] = useState<EvolutionService | null>(null);
    const [instanceName, setInstanceName] = useState<string>('sensei-primary');

    React.useEffect(() => {
        const savedUrl = localStorage.getItem('evolution_api_url');
        const savedKey = localStorage.getItem('evolution_api_key');
        const savedInstance = localStorage.getItem('evolution_instance_name');

        if (savedUrl && savedKey) {
            setService(new EvolutionService(savedUrl, savedKey));
        }
        if (savedInstance) setInstanceName(savedInstance);
    }, []);
    const [studentToEdit, setStudentToEdit] = useState<any | null>(null);
    const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
    const [studentToGraduate, setStudentToGraduate] = useState<any | null>(null);
    const [attendanceStats, setAttendanceStats] = useState({ count: 0, loading: false });

    const [studentForFinancial, setStudentForFinancial] = useState<any | null>(null);
    const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
    const [studentForAsaas, setStudentForAsaas] = useState<any | null>(null);
    const [isAsaasModalOpen, setIsAsaasModalOpen] = useState(false);

    React.useEffect(() => {
        if (selectedStudent?.id) {
            fetchAttendanceStats(selectedStudent.id);
        }
    }, [selectedStudent]);

    const fetchAttendanceStats = async (studentId: string) => {
        setAttendanceStats(prev => ({ ...prev, loading: true }));
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('present', true)
            .gte('date', thirtyDaysAgo.toISOString());

        setAttendanceStats({ count: count || 0, loading: false });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
            case 'debt': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20';
        }
    };

    const calculateRisk = () => {
        if (attendanceStats.loading) return { label: 'Calculando...', color: 'text-zinc-500 bg-zinc-500/10' };

        const count = attendanceStats.count;
        const weeklyLimit = selectedStudent?.plans?.weekly_limit || 3; // Default to 3 if no plan
        const expectedMonthly = weeklyLimit * 4;

        // If count is very low compared to expected
        if (count === 0) return { label: 'Crítico (0 Aulas)', color: 'text-red-600 bg-red-500/10' };

        const rate = (count / expectedMonthly) * 100;

        if (rate < 40) return { label: 'Alto Risco', color: 'text-red-500 bg-red-500/10' };
        if (rate < 75) return { label: 'Risco Médio', color: 'text-yellow-500 bg-yellow-500/10' };
        return { label: 'Baixo Risco', color: 'text-green-500 bg-green-500/10' };
    };

    const handleEdit = (student: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setStudentToEdit(student);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Tem certeza que deseja excluir este aluno?')) return;

        // Dynamic import to avoid circular dependency if using function from outside, 
        // but here we can just use supabase directly or update the hook.
        // Let's use supabase directly here for simplicity as it's a list component.
        const { supabase } = await import('@/lib/supabase');

        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) {
            alert('Erro ao excluir: ' + error.message);
        } else {
            // Optimistic update or refetch
            // We need 'refetch' from useStudents, but currently it might not be exposed or triggered easily.
            // Let's assume useStudents returns refetch based on previous context analysis (it did expose refetch).
            refetch();
        }
    };

    if (loading) return <div className="text-white">Carregando alunos...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <>
            <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-zinc-500"
                            placeholder="Search students..."
                        />
                    </div>
                    <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                {/* List */}
                <div className="grid gap-4">
                    {students.map(student => (
                        <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="group flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                    {student.avatar_url ? (
                                        <img src={student.avatar_url} alt={student.full_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-zinc-500">{student.full_name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">{student.full_name}</h3>
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 border opacity-90", getBeltColor(student.belt || 'Branca'))}>
                                            {student.belt || 'Branca'} {(student.degrees || 0) > 0 && `• ${student.degrees}º`}
                                        </Badge>
                                        <span>{student.plans?.name || 'No Plan'}</span>
                                        {student.modality && (
                                            <>
                                                <span className="text-zinc-700">•</span>
                                                <span className="text-zinc-500">{student.modality}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <Badge className={cn("capitalize", getStatusColor(student.status))}>
                                    {student.status}
                                </Badge>
                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-500 hover:text-emerald-500"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (!service) return alert('Configure o WhatsApp nas Configurações primeiro.');
                                            if (!student.phone) return alert('Aluno sem telefone cadastrado.');

                                            let phone = student.phone.replace(/\D/g, '');
                                            if (phone.length <= 11) phone = '55' + phone;

                                            const message = prompt('Digite a mensagem para enviar:', `Olá ${student.full_name}, tudo bem?`);
                                            if (!message) return;

                                            try {
                                                await service.sendText(instanceName, phone, message);
                                                alert('Mensagem enviada!');
                                            } catch (err) {
                                                alert('Erro ao enviar mensagem.');
                                            }
                                        }}
                                        title="Enviar WhatsApp"
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-500 hover:text-white"
                                        onClick={(e) => handleEdit(student, e)}
                                    >
                                        <div className="h-4 w-4">✎</div>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-zinc-500 hover:text-red-500"
                                        onClick={(e) => handleDelete(student.id, e)}
                                    >
                                        <div className="h-4 w-4">✕</div>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Details Drawer */}
            <Drawer
                isOpen={!!selectedStudent}
                onClose={() => setSelectedStudent(null)}
                title="Detalhes do Aluno"
            >
                {selectedStudent && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center py-6 border-b border-zinc-800">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-primary mb-4 bg-zinc-800 flex items-center justify-center">
                                {selectedStudent.avatar_url ? (
                                    <img src={selectedStudent.avatar_url} alt={selectedStudent.full_name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-zinc-500">{selectedStudent.full_name.charAt(0)}</span>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-white">{selectedStudent.full_name}</h3>
                            <p className="text-zinc-400">{selectedStudent.plans?.name || 'Sem Plano'}</p>
                            {selectedStudent.phone && (
                                <p className="text-white text-sm mt-1 font-medium bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                                    📞 {selectedStudent.phone}
                                </p>
                            )}
                            {selectedStudent.modality && <p className="text-zinc-500 text-sm mt-1">{selectedStudent.modality}</p>}
                            <Badge className={`mt-2 ${getStatusColor(selectedStudent.status)}`}>{selectedStudent.status}</Badge>
                        </div>

                        {/* AI Insights */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Métricas (IA)</h4>
                            <Card className="bg-zinc-800/50 border-zinc-700 p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-zinc-300">Risco de Evasão</span>
                                    <Badge className={calculateRisk().color}>
                                        {calculateRisk().label}
                                    </Badge>
                                </div>
                                <p className="text-xs text-zinc-500">
                                    Análise baseada na frequência nos últimos 30 dias ({attendanceStats.count} aulas) vs meta do plano.
                                </p>
                            </Card>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button className="w-full" variant="secondary" onClick={() => {
                                setStudentForFinancial(selectedStudent);
                                setIsFinancialModalOpen(true);
                            }}>
                                <Wallet className="mr-2 h-4 w-4" /> Financeiro
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => {
                                // Create a synthetic event or just pass null if handleEdit supports it, 
                                // but based on viewing, handleEdit calls e.stopPropagation()
                                handleEdit(selectedStudent, { stopPropagation: () => { } } as any);
                            }}>
                                <div className="mr-2 h-4 w-4">✎</div> Editar
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => {
                                setStudentToGraduate(selectedStudent);
                                setIsGraduationModalOpen(true);
                            }}>
                                <Swords className="mr-2 h-4 w-4" /> Graduar
                            </Button>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                    setStudentForAsaas(selectedStudent);
                                    setIsAsaasModalOpen(true);
                                }}
                            >
                                <CreditCard className="mr-2 h-4 w-4" /> Cobrar Asaas
                            </Button>

                            {/* WhatsApp Action */}
                            <Button
                                className="w-full col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={async () => {
                                    if (!service) return alert('Configure o WhatsApp nas Configurações primeiro.');
                                    if (!selectedStudent.phone) return alert('Aluno sem telefone cadastrado.');

                                    let phone = selectedStudent.phone.replace(/\D/g, '');
                                    if (phone.length <= 11) phone = '55' + phone;

                                    const message = prompt('Digite a mensagem para enviar:', `Olá ${selectedStudent.full_name}, tudo bem?`);
                                    if (!message) return;

                                    try {
                                        await service.sendText(instanceName, phone, message);
                                        alert('Mensagem enviada!');
                                    } catch (e) {
                                        alert('Erro ao enviar mensagem.');
                                    }
                                }}
                            >
                                <MessageSquare className="mr-2 h-4 w-4" /> Enviar WhatsApp
                            </Button>
                        </div>

                        <div className="pt-4 border-t border-zinc-800">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={(e) => {
                                    handleDelete(selectedStudent.id, e);
                                    setSelectedStudent(null);
                                }}
                            >
                                Excluir Aluno
                            </Button>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Lazy Load via Standard Import for now to avoid circular deps issues if generic, but here we just need the Modal */}
            {isEditModalOpen && (
                <EditModalWrapper
                    isOpen={isEditModalOpen}
                    onClose={() => { setIsEditModalOpen(false); setStudentToEdit(null); }}
                    studentToEdit={studentToEdit}
                    onSuccess={() => { refetch(); }}
                    whatsappService={service}
                    instanceName={instanceName}
                />
            )}

            {isGraduationModalOpen && studentToGraduate && (
                <GraduationModal
                    isOpen={isGraduationModalOpen}
                    onClose={() => { setIsGraduationModalOpen(false); setStudentToGraduate(null); }}
                    student={studentToGraduate}
                    onSuccess={() => {
                        refetch();
                        // Also update selected student if it's the same
                        if (selectedStudent && selectedStudent.id === studentToGraduate.id) {
                            setSelectedStudent({ ...selectedStudent, belt: studentToGraduate.belt, degrees: studentToGraduate.degrees });
                            // Verify if we can just re-select or need to wait for refetch. 
                            // Refetch updates list, but selectedStudent is local state. We might need to close drawer or manually update it.
                            // Better: Close drawer to force refresh or manually patch.
                            setSelectedStudent(null);
                        }
                    }}
                />
            )}

            <StudentFinancialModal
                isOpen={isFinancialModalOpen}
                onClose={() => setIsFinancialModalOpen(false)}
                student={studentForFinancial}
            />

            <AsaasSubscriptionModal
                isOpen={isAsaasModalOpen}
                onClose={() => { setIsAsaasModalOpen(false); setStudentForAsaas(null); }}
                student={studentForAsaas}
                onSuccess={() => refetch()}
            />
        </>
    );
}

// Helper for Belt Colors
function getBeltColor(belt: string) {
    const lower = belt?.toLowerCase() || '';
    if (lower.includes('branca')) return 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100';
    if (lower.includes('azul')) return 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700';
    if (lower.includes('roxa')) return 'bg-purple-600 text-white border-purple-500 hover:bg-purple-700';
    if (lower.includes('marrom')) return 'bg-amber-800 text-white border-amber-700 hover:bg-amber-900';
    if (lower.includes('preta')) return 'bg-zinc-950 text-white border-zinc-700 hover:bg-black shadow-[0_0_10px_rgba(255,255,255,0.2)]';
    if (lower.includes('cinza')) return 'bg-zinc-400 text-zinc-900 border-zinc-300';
    if (lower.includes('amarela')) return 'bg-yellow-400 text-zinc-900 border-yellow-300';
    if (lower.includes('laranja')) return 'bg-orange-500 text-white border-orange-400';
    if (lower.includes('verde')) return 'bg-green-600 text-white border-green-500';
    if (lower.includes('vermelha')) return 'bg-red-600 text-white border-red-500';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
}

