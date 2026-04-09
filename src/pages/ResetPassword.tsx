import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Dumbbell, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ResetPassword() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        // Supabase injeta a sessão via URL hash quando o usuário clica no link do e-mail
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setHasSession(true);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' && session) {
                setHasSession(true);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (!hasSession) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                    <CardContent className="flex flex-col items-center gap-4 py-10">
                        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-white font-semibold">Link inválido ou expirado</p>
                            <p className="text-zinc-400 text-sm">
                                Este link de redefinição não é válido ou já expirou. Solicite um novo link.
                            </p>
                        </div>
                        <Link to="/forgot-password">
                            <Button className="mt-2">Solicitar novo link</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Dumbbell className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Nova Senha</CardTitle>
                    <CardDescription>
                        Escolha uma nova senha segura para sua conta
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {success ? (
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-white font-semibold">Senha redefinida!</p>
                                <p className="text-zinc-400 text-sm">
                                    Sua senha foi atualizada com sucesso. Você será redirecionado para o login em instantes...
                                </p>
                            </div>
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
                                <Label htmlFor="password">Nova senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Mínimo 6 caracteres"
                                        className="bg-zinc-800 border-zinc-700 text-white pl-9 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                                    <Input
                                        id="confirm-password"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Repita a senha"
                                        className="bg-zinc-800 border-zinc-700 text-white pl-9 pr-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Indicador de força da senha */}
                            {password && (
                                <div className="space-y-1">
                                    <div className="flex gap-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${
                                                    i < getStrength(password)
                                                        ? strengthColor(getStrength(password))
                                                        : 'bg-zinc-700'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        {strengthLabel(getStrength(password))}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar nova senha
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-xs text-zinc-500">
                        Sensei © 2026 - Todos os direitos reservados
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

function getStrength(password: string): number {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

function strengthColor(strength: number): string {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
}

function strengthLabel(strength: number): string {
    if (strength <= 1) return 'Senha fraca';
    if (strength === 2) return 'Senha razoável';
    if (strength === 3) return 'Senha boa';
    return 'Senha forte';
}
