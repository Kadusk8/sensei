// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { AsaasService } from '@/services/asaas';
import { Loader2, CreditCard, QrCode, CheckCircle2, XCircle, Copy, ExternalLink } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface AsaasSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onSuccess?: () => void;
}

export function AsaasSubscriptionModal({ isOpen, onClose, student, onSuccess }: AsaasSubscriptionModalProps) {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
    const [value, setValue] = useState('');
    const [subscription, setSubscription] = useState<any>(null);
    const [existingSubscription, setExistingSubscription] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && student) {
            setStep('form');
            setError('');
            setSubscription(null);

            // Set default value from plan
            if (student.plans?.price) {
                setValue(String(student.plans.price));
            }

            // Check for existing subscription
            loadExistingData();
        }
    }, [isOpen, student]);

    const loadExistingData = async () => {
        if (!student) return;

        // Check existing active subscription
        const { data: existingSub } = await supabase
            .from('asaas_subscriptions')
            .select('*')
            .eq('student_id', student.id)
            .eq('status', 'ACTIVE')
            .maybeSingle();

        setExistingSubscription(existingSub);

        // Load payments if customer exists
        if (student.asaas_customer_id) {
            setLoadingPayments(true);
            try {
                const { data: paymentsData } = await supabase
                    .from('asaas_payments')
                    .select('*')
                    .eq('student_id', student.id)
                    .order('due_date', { ascending: false })
                    .limit(10);
                setPayments(paymentsData || []);
            } catch (e) {
                console.error('Erro ao carregar pagamentos:', e);
            } finally {
                setLoadingPayments(false);
            }
        }
    };

    const handleCreateSubscription = async () => {
        if (!student || !value) return;
        setLoading(true);
        setError('');

        try {
            let customerId = student.asaas_customer_id;

            // 1. Create customer if doesn't exist
            if (!customerId) {
                const customerResult = await AsaasService.createCustomer({
                    id: student.id,
                    full_name: student.full_name,
                    email: student.email,
                    cpf: student.cpf,
                    phone: student.phone,
                });
                customerId = customerResult.id;
            }

            // 2. Calculate next due date
            const today = new Date();
            const dueDay = student.due_day || today.getDate();
            let nextDue = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (nextDue <= today) {
                nextDue = addMonths(nextDue, 1);
            }
            const nextDueDate = format(nextDue, 'yyyy-MM-dd');

            // 3. Create subscription
            const sub = await AsaasService.createSubscription({
                customer_id: customerId,
                student_id: student.id,
                billing_type: billingType,
                value: parseFloat(value),
                next_due_date: nextDueDate,
                description: `Mensalidade - ${student.full_name}`,
            });

            setSubscription(sub);
            setStep('success');
            onSuccess?.();
        } catch (err: any) {
            console.error('Erro Asaas:', err);
            setError(err.message || 'Erro ao criar cobrança');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!existingSubscription) return;
        if (!confirm('Cancelar a cobrança recorrente deste aluno?')) return;

        setLoading(true);
        try {
            await AsaasService.cancelSubscription(existingSubscription.asaas_subscription_id);
            setExistingSubscription(null);
            onSuccess?.();
        } catch (err: any) {
            setError(err.message || 'Erro ao cancelar');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'RECEIVED': case 'CONFIRMED': return 'bg-green-500/20 text-green-400 border-0';
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-0';
            case 'OVERDUE': return 'bg-red-500/20 text-red-400 border-0';
            default: return 'bg-zinc-500/20 text-zinc-400 border-0';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'RECEIVED': case 'CONFIRMED': return 'Pago';
            case 'PENDING': return 'Pendente';
            case 'OVERDUE': return 'Vencido';
            case 'REFUNDED': return 'Estornado';
            default: return status;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-500" />
                        Cobrança Asaas — {student?.full_name}
                    </DialogTitle>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Existing subscription info */}
                {existingSubscription && step === 'form' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Assinatura Ativa
                            </span>
                            <Badge className={statusColor('RECEIVED')}>
                                {existingSubscription.billing_type === 'PIX' ? '◈ PIX' : '💳 Cartão'}
                            </Badge>
                        </div>
                        <div className="text-sm text-zinc-300">
                            Valor: <strong>{formatCurrency(existingSubscription.value)}</strong> / mês
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10 mt-2"
                            onClick={handleCancelSubscription}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                            <span className="ml-2">Cancelar Assinatura</span>
                        </Button>
                    </div>
                )}

                {/* Create subscription form */}
                {!existingSubscription && step === 'form' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Forma de Pagamento</Label>
                            <Select value={billingType} onValueChange={(v: any) => setBillingType(v)}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="PIX">◈ PIX</SelectItem>
                                    <SelectItem value="CREDIT_CARD">💳 Cartão de Crédito</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Valor Mensal (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Ex: 150.00"
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>

                        <div className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 space-y-1">
                            <p>• A cobrança será gerada automaticamente todo mês</p>
                            <p>• Dia de vencimento: <strong className="text-white">{student?.due_day || 'Não definido'}</strong></p>
                            <p>• O aluno receberá o link de pagamento via Asaas</p>
                            {billingType === 'CREDIT_CARD' && (
                                <p>• O aluno preencherá os dados do cartão no checkout Asaas</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose} className="border-zinc-700">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateSubscription}
                                disabled={loading || !value}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Criando...
                                    </>
                                ) : (
                                    'Criar Cobrança Recorrente'
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Success */}
                {step === 'success' && subscription && (
                    <div className="space-y-4 text-center py-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Cobrança criada com sucesso!</h3>
                        <p className="text-sm text-zinc-400">
                            A primeira cobrança já foi gerada. O aluno receberá o link de pagamento.
                        </p>

                        {subscription.invoiceUrl && (
                            <a
                                href={subscription.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-lg text-sm text-emerald-400 hover:bg-zinc-700 transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Ver Fatura
                            </a>
                        )}

                        <DialogFooter className="mt-4">
                            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                                Fechar
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Payment History */}
                {payments.length > 0 && (
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-sm font-medium text-zinc-400 mb-3">Histórico de Pagamentos</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {payments.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/50 text-sm">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-300">
                                            {p.due_date ? format(new Date(p.due_date), 'dd/MM/yyyy') : '—'}
                                        </span>
                                        <span className="text-xs text-zinc-500">{p.billing_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-white">{formatCurrency(p.value)}</span>
                                        <Badge className={statusColor(p.status)}>
                                            {statusLabel(p.status)}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
