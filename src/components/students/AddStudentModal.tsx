import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/types/database';

import { EvolutionService } from '@/services/whatsapp';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentToEdit?: any | null;
    whatsappService?: EvolutionService | null;
    instanceName?: string;
}

export function AddStudentModal({ isOpen, onClose, onSuccess, studentToEdit, whatsappService, instanceName }: AddStudentModalProps) {
    const [loading, setLoading] = useState(false);
    const [full_name, setFullName] = useState('');
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [plan_id, setPlanId] = useState<string>('');
    const [modality, setModality] = useState('');
    const [phone, setPhone] = useState('');
    const [belt, setBelt] = useState('Branca');
    const [degrees, setDegrees] = useState(0);
    const [due_day, setDueDay] = useState(10);
    const [avatar_url, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [professor_id, setProfessorId] = useState<string>('');
    const [class_id, setClassId] = useState<string>('');

    const [plans, setPlans] = useState<Database['public']['Tables']['plans']['Row'][]>([]);
    const [professors, setProfessors] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [gymName, setGymName] = useState('Sensei'); // Default fallback

    useEffect(() => {
        if (isOpen) {
            fetchData();
            if (studentToEdit) {
                setFullName(studentToEdit.full_name);
                setCpf(studentToEdit.cpf || '');
                setEmail(studentToEdit.email || '');
                setPlanId(studentToEdit.plan_id || '');
                setModality(studentToEdit.modality || '');
                setPhone(studentToEdit.phone || '');
                setBelt(studentToEdit.belt || 'Branca');
                setDegrees(studentToEdit.degrees || 0);
                setDueDay(studentToEdit.due_day || 10);
                setAvatarUrl(studentToEdit.avatar_url || '');
                setProfessorId(studentToEdit.professor_id || '');
                setClassId(studentToEdit.class_id || '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, studentToEdit]);

    async function fetchData() {
        try {
            const [plansRes, profsRes, classesRes, gymRes] = await Promise.all([
                supabase.from('plans').select('*').order('price'),
                supabase.from('professors').select('*').order('full_name'),
                supabase.from('classes').select('*').order('name'),
                supabase.from('gym_info').select('name').single()
            ]);

            if (plansRes.data) setPlans(plansRes.data);
            if (profsRes.data) setProfessors(profsRes.data);
            if (classesRes.data) setClasses(classesRes.data);
            // @ts-ignore
            if (gymRes.data && gymRes.data.name) setGymName(gymRes.data.name);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    function resetForm() {
        setFullName('');
        setCpf('');
        setEmail('');
        setPlanId('');
        setModality('');
        setPhone('');
        setBelt('Branca');
        setDegrees(0);
        setDueDay(10);
        setAvatarUrl('');
        setProfessorId('');
        setClassId('');
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem para upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-photos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('student-photos').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (studentToEdit) {
                const { error } = await (supabase.from('students') as any).update({
                    full_name,
                    cpf: cpf || null,
                    email: email || null,
                    plan_id: plan_id || null,
                    modality: modality || null,
                    phone: phone || null,
                    belt: belt || 'Branca',
                    degrees: degrees || 0,
                    due_day: parseInt(due_day.toString()),
                    avatar_url: avatar_url || null,
                    professor_id: professor_id || null,
                    class_id: class_id || null
                }).eq('id', studentToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase.from('students') as any).insert([
                    {
                        full_name,
                        cpf: cpf || null,
                        email: email || null,
                        plan_id: plan_id || null,
                        status: 'active',
                        modality: modality || null,
                        phone: phone || null,
                        belt: belt || 'Branca',
                        degrees: degrees || 0,
                        due_day: parseInt(due_day.toString()),
                        avatar_url: avatar_url || null,
                        professor_id: professor_id || null,
                        class_id: class_id || null
                    }
                ]);
                if (error) throw error;

                // Send Welcome Message if WhatsApp is configured
                if (whatsappService && instanceName && phone) {
                    try {
                        let targetPhone = phone.replace(/\D/g, '');
                        if (targetPhone.length <= 11) targetPhone = '55' + targetPhone;

                        const plan = plans.find(p => p.id === plan_id);
                        const professor = professors.find(p => p.id === professor_id);
                        const selectedClass = classes.find(c => c.id === class_id);

                        const dayTranslation: Record<string, string> = {
                            'Mon': 'Seg', 'Tue': 'Ter', 'Wed': 'Qua', 'Thu': 'Qui', 'Fri': 'Sex', 'Sat': 'Sáb', 'Sun': 'Dom',
                            'Monday': 'Segunda', 'Tuesday': 'Terça', 'Wednesday': 'Quarta', 'Thursday': 'Quinta', 'Friday': 'Sexta', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
                        };

                        const translateDays = (days: string[]) => {
                            return days.map(d => dayTranslation[d] || d).join(', ');
                        };

                        // Build Class/Schedule info
                        let scheduleText = '';
                        if (selectedClass) {
                            const days = selectedClass.days_of_week ? translateDays(selectedClass.days_of_week) : '';
                            const time = selectedClass.schedule_time?.substring(0, 5); // 20:00:00 -> 20:00
                            scheduleText = `\n\n🏫 *Sua Turma:*\n${selectedClass.name}\n⏰ ${days} às ${time}`;
                        } else if (modality) {
                            // Fallback: Try to find classes matching modality if no specific class selected
                            const { data } = await supabase
                                .from('classes')
                                .select('name, days_of_week, schedule_time')
                                .ilike('name', `%${modality}%`);

                            const matchingClasses = data as any[];

                            if (matchingClasses && matchingClasses.length > 0) {
                                const classDetails = matchingClasses.map(c => {
                                    const d = c.days_of_week ? translateDays(c.days_of_week) : '';
                                    const t = c.schedule_time?.substring(0, 5);
                                    return `- ${c.name}: ${d} às ${t}`;
                                }).join('\n');
                                scheduleText = `\n\n🕒 *Horários Disponíveis:*\n${classDetails}`;
                            }
                        }

                        const message = `🥋 *Bem-vindo(a) à ${gymName}, ${full_name}!* \n\n` +
                            `✅ Cadastro realizado com sucesso.\n` +
                            `📋 *Plano:* ${plan?.name || 'Padrão'} (Vencimento dia ${due_day})\n` +
                            (professor ? `👨‍🏫 *Professor:* ${professor.full_name}\n` : '') +
                            (scheduleText ? scheduleText : '\nConsulte a grade de horários na recepção.') +
                            `\n\nBons treinos! 💪`;

                        await whatsappService.sendText(instanceName, targetPhone, message);
                        console.log('Welcome message sent to', targetPhone);
                    } catch (msgError) {
                        console.error('Error sending welcome message:', msgError);
                        // Don't block success flow if message fails, just log it
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Erro ao salvar aluno.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>{studentToEdit ? 'Editar Aluno' : 'Adicionar Novo Aluno'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center group">
                            {avatar_url ? (
                                <img src={avatar_url} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-zinc-500 text-2xl">📷</span>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <span className="text-xs text-white">Alterar</span>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50"
                            />
                        </div>
                        {uploading && <span className="text-xs text-zinc-400 animate-pulse">Enviando foto...</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            value={full_name}
                            onChange={(e) => setFullName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <Input
                                id="cpf"
                                value={cpf}
                                onChange={(e) => {
                                    // Format CPF: 000.000.000-00
                                    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                                    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                                    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                                    setCpf(v);
                                }}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="email@exemplo.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="modality">Modalidade</Label>
                            <Input
                                id="modality"
                                value={modality}
                                onChange={(e) => setModality(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="Ex: Jiu Jitsu"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">WhatsApp</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="belt">Faixa Atual</Label>
                            <Select value={belt} onValueChange={setBelt}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="Branca">Branca</SelectItem>
                                    <SelectItem value="Cinza">Cinza (Kids)</SelectItem>
                                    <SelectItem value="Amarela">Amarela (Kids)</SelectItem>
                                    <SelectItem value="Laranja">Laranja (Kids)</SelectItem>
                                    <SelectItem value="Verde">Verde (Kids)</SelectItem>
                                    <SelectItem value="Azul">Azul</SelectItem>
                                    <SelectItem value="Roxa">Roxa</SelectItem>
                                    <SelectItem value="Marrom">Marrom</SelectItem>
                                    <SelectItem value="Preta">Preta</SelectItem>
                                    <SelectItem value="Vermelha">Vermelha (Coral/Mestre)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="degrees">Graus (Dan/Stripe)</Label>
                            <Select value={degrees.toString()} onValueChange={(v) => setDegrees(parseInt(v))}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="0" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectItem value="0">0 (Lisa)</SelectItem>
                                    <SelectItem value="1">1º Grau</SelectItem>
                                    <SelectItem value="2">2º Grau</SelectItem>
                                    <SelectItem value="3">3º Grau</SelectItem>
                                    <SelectItem value="4">4º Grau</SelectItem>
                                    <SelectItem value="5">5º Grau (Black Belt+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plan">Plano</Label>
                            <Select value={plan_id} onValueChange={setPlanId}>
                                <SelectTrigger id="plan" className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione um plano" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id} className="focus:bg-zinc-700">
                                            {plan.name} - R$ {plan.price}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="due_day">Dia Vencimento</Label>
                            <Select value={due_day.toString()} onValueChange={(v) => setDueDay(parseInt(v))}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white h-[200px]">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                        <SelectItem key={day} value={day.toString()}>
                                            Dia {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="professor">Professor Responsável</Label>
                            <Select value={professor_id} onValueChange={setProfessorId}>
                                <SelectTrigger id="professor" className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    {professors.map((p) => (
                                        <SelectItem key={p.id} value={p.id} className="focus:bg-zinc-700">
                                            {p.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="class">Turma</Label>
                            <Select value={class_id} onValueChange={setClassId}>
                                <SelectTrigger id="class" className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id} className="focus:bg-zinc-700">
                                            {c.name} ({c.schedule_time})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
