import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Dumbbell, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (isSignUp: boolean) => {
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: email.split('@')[0], // Default name
                            role: 'admin', // Default role for testing
                        }
                    }
                });
                if (error) throw error;
                // Auto login happens if email confirmation is disabled, otherwise let user know
                alert('Conta criada! Se necessário, verifique seu email.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(message === 'Invalid login credentials'
                ? 'Email ou senha incorretos.'
                : message);
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
                    <CardTitle className="text-2xl font-bold text-white">Sensei System</CardTitle>
                    <CardDescription>
                        Faça login para acessar o painel administrativo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="register">Criar Conta</TabsTrigger>
                        </TabsList>

                        {error && (
                            <Alert variant="destructive" className="mt-4 bg-red-900/20 border-red-900/50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@sensei.com"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <TabsContent value="login" className="mt-4">
                            <Button
                                className="w-full"
                                onClick={() => handleAuth(false)}
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Acessar Painel
                            </Button>
                        </TabsContent>

                        <TabsContent value="register" className="mt-4">
                            <Button
                                className="w-full"
                                onClick={() => handleAuth(true)}
                                disabled={loading}
                                variant="secondary"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Criar Nova Conta
                            </Button>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-zinc-500">
                        Sensei &copy; 2026 - Todos os direitos reservados
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
