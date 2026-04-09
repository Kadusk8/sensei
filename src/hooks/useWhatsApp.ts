import { useState, useEffect } from 'react';
import { EvolutionService } from '@/services/whatsapp';

export function useWhatsApp() {
    const [service, setService] = useState<EvolutionService | null>(null);
    const [instanceName, setInstanceName] = useState('');

    useEffect(() => {
        const url = localStorage.getItem('evolution_api_url');
        const key = localStorage.getItem('evolution_api_key');
        const instance = localStorage.getItem('evolution_instance_name');

        if (url && key) setService(new EvolutionService(url, key));
        if (instance) setInstanceName(instance);
    }, []);

    const isConfigured = service !== null && instanceName !== '';

    return { service, instanceName, isConfigured };
}
