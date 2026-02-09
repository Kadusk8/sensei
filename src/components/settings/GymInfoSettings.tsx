// @ts-nocheck
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function GymInfoSettings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        fetchGymInfo();
    }, []);

    async function fetchGymInfo() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gym_info')
                .select('*')
                .single();

            if (data) {
// @ts-ignore
                setId(data.id);
// @ts-ignore
                setName(data.name || '');
// @ts-ignore
                setPhone(data.phone || '');
            } else if (error && error.code !== 'PGRST116') {
                // Ignore "no rows" error (PGRST116) as we might need to insert first
                console.error('Error fetching gym info:', error);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            if (id) {
                const { error } = await supabase
                    .from('gym_info')
// @ts-ignore
                    .update({
                        name,
                        phone,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('gym_info')
// @ts-ignore
                    .insert([{ name, phone }]);

                if (error) throw error;
                fetchGymInfo(); // Refresh to get ID
            }
            alert('Informações salvas com sucesso!');
        } catch (error: any) {
            console.error('Error saving:', error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="text-zinc-500">Carregando informações da academia...</div>;
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dados da Academia
                </CardTitle>
                <CardDescription>
                    Informações usadas nas mensagens automáticas e relatórios.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="gym-name">Nome da Academia</Label>
                        <Input
                            id="gym-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Ex: Iron Gym"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gym-phone">Telefone de Contato</Label>
                        <Input
                            id="gym-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            placeholder="Ex: (11) 99999-9999"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
