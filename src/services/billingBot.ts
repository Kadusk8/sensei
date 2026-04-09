import { supabase } from '@/lib/supabase';
import { EvolutionService } from './whatsapp';

export class BillingBot {
    private whatsapp: EvolutionService;
    private instanceName: string;

    constructor(whatsappService: EvolutionService, instanceName: string) {
        this.whatsapp = whatsappService;
        this.instanceName = instanceName;
    }

    async checkAndNotifyDuePayments(dryRun: boolean = false): Promise<{ processed: number, sent: number, errors: number, logs: string[] }> {
        const logs: string[] = [];
        let sentCount = 0;
        let errorCount = 0;
        let students: { id: string; full_name: string; phone: string | null; plan_id: string | null; due_day: number | null; status: string; plans: { name: string; price: number } | null }[] = [];

        try {
            const today = new Date();
            const currentDay = today.getDate();

            // 0. Fetch Gym Info
            let gymName = 'Sua Academia';
            const { data: gymInfo } = await supabase.from('gym_info').select('name').single() as { data: { name: string } | null };
            if (gymInfo?.name) gymName = gymInfo.name;

            logs.push(`🔍 Buscando alunos com vencimento dia ${currentDay}...`);

            // 1. Get active students with due_day = today
            // We fetch plan info as well
            const { data: studentsData, error } = await supabase
                .from('students')
                .select(`
                    id, full_name, phone, plan_id, due_day, status,
                    plans ( name, price )
                `)
                .eq('status', 'active')
                .eq('due_day', currentDay);

            if (studentsData) students = studentsData;

            if (error) throw error;
            if (!students || students.length === 0) {
                logs.push("✅ Nenhum aluno com vencimento hoje.");
                return { processed: 0, sent: 0, errors: 0, logs };
            }

            logs.push(`📋 Encontrados ${students.length} alunos com vencimento hoje.`);

            for (const student of students) {
                try {
                    // Check if already paid for this month
                    // Logic: Look for income transaction for this student in current month

                    // Note: We need a reliable way to link transaction to student. 
                    // Assuming 'student_id' exists on transactions or we match by check-in/name? 
                    // Let's assume we don't have perfect linking yet, so we'll be CAUTIOUS.
                    // For now, simpler approach: Just remind them "Today is due day".
                    // "Lembrete: Sua mensalidade vence hoje."

                    if (!student.phone) {
                        logs.push(`⚠️ Aluno ${student.full_name} sem telefone. Pular.`);
                        continue;
                    }

                    const phone = student.phone.replace(/\D/g, '');
                    const targetPhone = phone.length <= 11 ? `55${phone}` : phone;
                    const planName = student.plans?.name || 'Plano';
                    const price = student.plans?.price || 0;

                    const message = `🔔 *Lembrete de Vencimento*\n\n` +
                        `Olá, ${student.full_name}!\n` +
                        `Passando para lembrar que sua mensalidade do plano *${planName}* vence hoje.\n\n` +
                        `Valor: R$ ${price.toFixed(2)}\n\n` +
                        `Qualquer dúvida, estamos à disposição!\n` +
                        `_${gymName} - Sistema Automático_`;

                    if (!dryRun) {
                        await this.whatsapp.sendText(this.instanceName, targetPhone, message);
                        logs.push(`✅ Mensagem enviada para ${student.full_name} (${targetPhone})`);
                        sentCount++;
                    } else {
                        logs.push(`[SIMULAÇÃO] Enviaria para ${student.full_name}: "${message.substring(0, 30)}..."`);
                    }

                } catch (err: any) {
                    logs.push(`❌ Erro ao enviar para ${student.full_name}: ${err.message}`);
                    errorCount++;
                }
            }

        } catch (error: any) {
            logs.push(`❌ Erro geral no bot: ${error.message}`);
            console.error(error);
        }

        return { processed: students?.length || 0, sent: sentCount, errors: errorCount, logs };
    }
}
