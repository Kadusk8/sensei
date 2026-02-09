import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, QrCode, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { EvolutionService } from '@/services/whatsapp';

export function WhatsAppSettings() {
    const [apiUrl, setApiUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [instanceName, setInstanceName] = useState('sensei-primary');
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
    const [service, setService] = useState<EvolutionService | null>(null);

    // Persist API Config
    useEffect(() => {
        const savedUrl = localStorage.getItem('evolution_api_url');
        const savedKey = localStorage.getItem('evolution_api_key');
        const savedInstance = localStorage.getItem('evolution_instance_name');

        if (savedUrl) setApiUrl(savedUrl);
        if (savedKey) setApiKey(savedKey);
        if (savedInstance) setInstanceName(savedInstance);

        if (savedUrl && savedKey) {
            setService(new EvolutionService(savedUrl, savedKey));
        }
    }, []);

    const handleSaveConfig = () => {
        localStorage.setItem('evolution_api_url', apiUrl);
        localStorage.setItem('evolution_api_key', apiKey);
        localStorage.setItem('evolution_instance_name', instanceName);
        setService(new EvolutionService(apiUrl, apiKey));
        alert('Configurações salvas!');
    };

    const handleConnect = async () => {
        if (!service) return;
        setLoading(true);
        setQrCode(null);

        try {
            // 1. Try to fetch instances to see if ours exists
            const instances = await service.fetchInstances();
            const exists = instances.find((i: any) => i.instanceName === instanceName);

            if (!exists) {
                // Create
                await service.createInstance(instanceName);
            }

            // 2. Connect (Get QR)
            const data = await service.connectInstance(instanceName);

            if (data?.base64) {
                setQrCode(data.base64);
                setStatus('CONNECTING');
            } else if (data?.instance?.state === 'open') {
                setStatus('CONNECTED');
            }

        } catch (error) {
            console.error('Connection failed:', error);
            alert('Falha ao conectar. Verifique URL e API Key.');
        } finally {
            setLoading(false);
        }
    };

    const checkStatus = async () => {
        if (!service) return;
        try {
            const data = await service.getConnectionState(instanceName);
            if (data?.instance?.state === 'open') {
                setStatus('CONNECTED');
                setQrCode(null);
            } else {
                setStatus('DISCONNECTED');
            }
        } catch (error) {
            console.error('Check status failed');
        }
    };

    const handleDelete = async () => {
        if (!service || !confirm('Tem certeza? Isso irá desconectar o WhatsApp.')) return;
        setLoading(true);
        try {
            await service.deleteInstance(instanceName);
            setStatus('DISCONNECTED');
            setQrCode(null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-emerald-500" />
                        Configuração WhatsApp (Evolution API)
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Conecte seu sistema ao WhatsApp para enviar mensagens automáticas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white">Nome da Instância</Label>
                            <Input
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="Ex: academia-zap"
                                value={instanceName}
                                onChange={e => setInstanceName(e.target.value)}
                            />
                            <p className="text-xs text-zinc-500">Nome da instância criada na Evolution API.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-white">API URL</Label>
                            <Input
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="https://api.seadominio.com"
                                value={apiUrl}
                                onChange={e => setApiUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-white">Global API Key</Label>
                            <Input
                                className="bg-zinc-800 border-zinc-700 text-white"
                                type="password"
                                placeholder="Sua chave de API global"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveConfig} className="bg-emerald-600 hover:bg-emerald-700">
                            Salvar Configuração
                        </Button>
                    </div>

                    <div className="border-t border-zinc-800 pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">Instância: {instanceName}</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={checkStatus} className="border-zinc-700 text-zinc-300">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Verificar Status
                                </Button>
                                {status === 'CONNECTED' && (
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Desconectar
                                    </Button>
                                )}
                            </div>
                        </div>

                        {status === 'CONNECTED' ? (
                            <div className="space-y-4">
                                <Alert className="bg-emerald-500/10 border-emerald-500/50">
                                    <MessageSquare className="h-4 w-4 text-emerald-500" />
                                    <AlertTitle className="text-emerald-500">Conectado</AlertTitle>
                                    <AlertDescription className="text-emerald-200">
                                        O WhatsApp está conectado e pronto para enviar mensagens.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex gap-2 items-center p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <div className="flex-1">
                                        <Label className="text-xs text-zinc-400 mb-1.5 block">Enviar Mensagem de Teste</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="5511999999999"
                                                className="bg-zinc-800 border-zinc-700 text-white"
                                                id="test-number"
                                            />
                                            <Button
                                                variant="secondary"
                                                onClick={async () => {
                                                    const input = document.getElementById('test-number') as HTMLInputElement;
                                                    let number = input.value.replace(/\D/g, ''); // Remove non-digits

                                                    if (!number) return alert('Digite um número');

                                                    // Basic validation for Brazil (often missing 55)
                                                    if (number.length === 11 || number.length === 10) {
                                                        if (!confirm(`O número ${number} parece estar sem o código do país (55). Deseja adicionar automaticamente? (Ficará 55${number})`)) {
                                                            return;
                                                        }
                                                        number = '55' + number;
                                                    }

                                                    if (!service) return;

                                                    try {
                                                        await service.sendText(instanceName, number, 'Teste de conexão Sensei 🥋');
                                                        alert('Mensagem enviada com sucesso!');
                                                    } catch (e: any) {
                                                        console.error(e);
                                                        const errorMsg = e.response?.data?.message || e.message || 'Erro desconhecido';
                                                        alert(`Erro ao enviar: ${errorMsg}\n\nVerifique se a URL da API permite conexões externas (CORS) ou se a instância está realmente conectada.`);
                                                    }
                                                }}
                                            >
                                                Enviar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-zinc-950/50 rounded-lg border border-zinc-800 border-dashed">
                                {qrCode ? (
                                    <div className="text-center space-y-4">
                                        <p className="text-white mb-2">Escaneie o QR Code no seu WhatsApp</p>
                                        <img src={qrCode} alt="QR Code WhatsApp" className="mx-auto border-4 border-white rounded-lg h-64 w-64" />
                                        <Button variant="ghost" className="text-zinc-500" onClick={() => setQrCode(null)}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                                            <QrCode className="h-8 w-8 text-zinc-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-white font-medium">Nenhuma conexão ativa</h4>
                                            <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                                                Clique abaixo para gerar um QR Code e conectar seu WhatsApp.
                                            </p>
                                        </div>
                                        <Button onClick={handleConnect} disabled={loading || !service}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Conectar WhatsApp
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
