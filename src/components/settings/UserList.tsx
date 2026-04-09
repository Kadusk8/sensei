import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Shield, User, GraduationCap, Loader2, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { AddUserModal } from './AddUserModal';
import { toast } from 'sonner';

interface Profile {
    id: string;
    full_name: string;
    role: 'admin' | 'professor' | 'secretary';
    created_at: string;
}

export function UserList() {
    const { role: currentUserRole, user: currentUser } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Modal de alterar senha
    const [changePasswordUser, setChangePasswordUser] = useState<Profile | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name');

            if (error) throw error;
            // @ts-ignore
            if (data) setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await supabase.functions.invoke('delete-user', {
                body: { user_id: userId },
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });

            if (response.error) throw response.error;
            if (response.data?.error) throw new Error(response.data.error);

            fetchUsers();
            toast.success('Usuário excluído com sucesso!');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast.error('Erro ao excluir usuário: ' + error.message);
        }
    };

    const handleChangePassword = async () => {
        if (!changePasswordUser) return;
        if (newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setChangingPassword(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await supabase.functions.invoke('change-password', {
                body: { user_id: changePasswordUser.id, new_password: newPassword },
                headers: { Authorization: `Bearer ${session?.access_token}` },
            });

            if (response.error) throw response.error;
            if (response.data?.error) throw new Error(response.data.error);

            toast.success(`Senha de ${changePasswordUser.full_name} alterada com sucesso!`);
            setChangePasswordUser(null);
            setNewPassword('');
        } catch (error: any) {
            console.error('Error changing password:', error);
            toast.error('Erro ao alterar senha: ' + error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-red-500/20 text-red-500 border-0 hover:bg-red-500/30">ADMIN</Badge>;
            case 'secretary':
                return <Badge className="bg-blue-500/20 text-blue-500 border-0 hover:bg-blue-500/30">SECRETARIA</Badge>;
            case 'professor':
                return <Badge className="bg-green-500/20 text-green-500 border-0 hover:bg-green-500/30">PROFESSOR</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
            case 'secretary': return <User className="h-4 w-4 text-blue-500" />;
            case 'professor': return <GraduationCap className="h-4 w-4 text-green-500" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    return (
        <>
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Equipe e Acessos
                        </CardTitle>
                        <CardDescription>
                            Gerencie quem tem acesso ao sistema (Login)
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <div className="space-y-4 pt-4">
                            {users.length === 0 ? (
                                <p className="text-center text-zinc-500 py-4">Nenhum usuário encontrado (além de você).</p>
                            ) : (
                                users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{user.full_name}</p>
                                                <p className="text-xs text-zinc-500 uppercase tracking-wider">{user.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getRoleBadge(user.role)}
                                            {currentUserRole === 'admin' && currentUser?.id !== user.id && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-yellow-500 hover:bg-yellow-500/10"
                                                        onClick={() => { setChangePasswordUser(user); setNewPassword(''); }}
                                                        title="Alterar Senha"
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        title="Excluir Usuário"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchUsers}
            />

            {/* Modal de Alterar Senha */}
            <Dialog open={!!changePasswordUser} onOpenChange={(open) => { if (!open) { setChangePasswordUser(null); setNewPassword(''); } }}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Definir nova senha para <span className="text-white font-medium">{changePasswordUser?.full_name}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <Label htmlFor="new_password">Nova Senha</Label>
                        <Input
                            id="new_password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-zinc-800 border-zinc-700"
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => { setChangePasswordUser(null); setNewPassword(''); }}
                            className="hover:bg-zinc-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            disabled={changingPassword || newPassword.length < 6}
                            onClick={handleChangePassword}
                            className="bg-yellow-600 hover:bg-yellow-700"
                        >
                            {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Senha
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
