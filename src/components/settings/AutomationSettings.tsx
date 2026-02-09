// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Play, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { EvolutionService } from '@/services/whatsapp';
import { BillingBot } from '@/services/billingBot';

export function AutomationSettings() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Helper to get service (reusing logic from WhatsAppSettings essentially)
    const getService = () => {
        const url = localStorage.getItem('evolution_api_url');
        const key = localStorage.getItem('evolution_api_key');
        const instance = localStorage.getItem('evolution_instance_name');

        if (!url || !key || !instance) return null;
        return { service: new EvolutionService(url, key), instanceName: instance };
    };

    const handleRunBilling = async (dryRun: boolean) => {
        const config = getService();
        if (!config) {
            alert("Configure a conexão do WhatsApp primeiro!");
            return;
        }

        setLoading(true);
        setLogs(prev => [`🚀 Iniciando robô de cobrança (${dryRun ? 'Simulação' : 'ENVIO REAL'})...`, ...prev]);

        try {
            const bot = new BillingBot(config.service, config.instanceName);
            const result = await bot.checkAndNotifyDuePayments(dryRun);

            setLogs(prev => [
                `🏁 Finalizado. Processados: ${result.processed}, Enviados: ${result.sent}, Erros: ${result.errors}`,
                ...result.logs,
                ...prev
            ]);

        } catch (error: any) {
            setLogs(prev => [`❌ Erro fatal: ${error.message}`, ...prev]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-yellow-500" />
                    Robô de Cobrança
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Automatize o envio de lembretes de vencimento via WhatsApp.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                    <h4 className="text-yellow-500 font-medium flex items-center gap-2 mb-2">
                        <ShieldAlert className="h-4 w-4" />
                        Atenção
                    </h4>
                    <p className="text-sm text-yellow-200/80">
                        O robô buscará todos os alunos Ativos cujo <strong>Dia de Vencimento</strong> é hoje ({new Date().getDate()}).
                        Certifique-se de que os telefones estão cadastrados corretamente com DDD (Ex: 11999999999).
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                        onClick={() => handleRunBilling(true)}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Simular Envio (Logs)
                    </Button>
                    <Button
                        onClick={() => handleRunBilling(false)}
                        disabled={loading}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                        <Play className="mr-2 h-4 w-4" />
                        Executar Cobrança Agora
                    </Button>
                </div>

                {logs.length > 0 && (
                    <div className="mt-6">
                        <Label className="text-white mb-2 block">Logs de Execução</Label>
                        <div className="bg-black/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1">
                            {logs.map((log, i) => (
                                <div key={i} className="border-b border-zinc-800/50 pb-1 last:border-0">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Add simple Label component wrapper if missing or import generic one
function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={className}>{children}</span>;
}
