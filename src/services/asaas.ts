// @ts-nocheck
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

async function callAsaasProxy(action: string, body?: any, params?: Record<string, string>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado');

    const searchParams = new URLSearchParams({ action, ...params });
    const url = `${SUPABASE_URL}/functions/v1/asaas-proxy?${searchParams}`;

    const res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    return data;
}

export const AsaasService = {
    // Create a customer in Asaas
    async createCustomer(student: { id: string; full_name: string; email?: string; cpf?: string; phone?: string }) {
        return callAsaasProxy('create_customer', {
            name: student.full_name,
            email: student.email || undefined,
            cpfCnpj: student.cpf || undefined,
            phone: student.phone || undefined,
            student_id: student.id,
        });
    },

    // Create a recurring subscription
    async createSubscription(params: {
        customer_id: string;
        student_id: string;
        billing_type: 'PIX' | 'CREDIT_CARD';
        value: number;
        next_due_date: string;
        description?: string;
    }) {
        return callAsaasProxy('create_subscription', params);
    },

    // Cancel a subscription
    async cancelSubscription(asaas_subscription_id: string) {
        return callAsaasProxy('cancel_subscription', { asaas_subscription_id });
    },

    // Get PIX QR Code for a payment
    async getPixQrCode(payment_id: string) {
        return callAsaasProxy('get_pix_qrcode', undefined, { payment_id });
    },

    // List payments for a customer
    async listPayments(customer_id: string) {
        return callAsaasProxy('list_payments', undefined, { customer_id });
    },

    // Get subscription details
    async getSubscription(subscription_id: string) {
        return callAsaasProxy('get_subscription', undefined, { subscription_id });
    },
};
