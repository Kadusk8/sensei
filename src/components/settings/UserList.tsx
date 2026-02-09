import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Shield, User, GraduationCap, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AddUserModal } from './AddUserModal';

interface Profile {
    id: string;
    full_name: string;
    role: 'admin' | 'professor' | 'secretary';
    created_at: string;
}

export function UserList() {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
                                        <div>
                                            {getRoleBadge(user.role)}
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
        </>
    );
}
