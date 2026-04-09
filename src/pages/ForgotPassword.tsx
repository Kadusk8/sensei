import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Dumbbell, Loader2, AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ForgotPassword() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Recuperar Senha</CardTitle>
                    <CardDescription>
                        Informe seu e-mail para receber o link de redefinição de senha
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-white font-semibold">E-mail enviado!</p>
                                <p className="text-zinc-400 text-sm">
                                    Verifique sua caixa de entrada em{' '}
                                    <span className="text-primary font-medium">{email}</span> e clique
                                    no link para redefinir sua senha.
                                </p>
                                <p className="text-zinc-500 text-xs">
                                    Não recebeu? Verifique a pasta de spam.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="mt-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => { setSuccess(false); setEmail(''); }}
                            >
                                Tentar com outro e-mail
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail cadastrado</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        className="bg-zinc-800 border-zinc-700 text-white pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar link de recuperação
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center">
                    <Link
                        to="/login"
                        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar ao login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
