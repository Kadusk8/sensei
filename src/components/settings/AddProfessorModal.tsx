// @ts-nocheck
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AddProfessorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddProfessorModal({ isOpen, onClose, onSuccess }: AddProfessorModalProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [modality, setModality] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            // Note: In a real auth system, we would create a User in Supabase Auth first.
            // For this simple ERP usage mostly for gym management, we might just create a Profile 
            // entry if they are just "entities" in the system, but since 'id' is FK to auth.users,
            // we have a constraint. 
            // WORKAROUND: For now, we will create a "dummy" auth user or rely on the fact 
            // that we might have changed the schema to allow profiles without auth users 
            // OR we just create a profile with a random UUID if the constraint allows it (it doesn't usually).

            // Checking schema from previous turn: "id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE"
            // This means we CANNOT just insert into profiles without an auth user.
            // We must create an auth user or (hack) remove the foreign key constraint.

            // BETTER APPROACH for "Employees": 
            // Provide email/password for them.

            // 1. Create Auth User... (comments preserved)

            // Since we are logged in, we can't easily "SignUp" another user without losing session unless we use Admin API.
            // Client side "signUp" logs you in as the new user.

            // ALTERNATIVE: Use a "Professors" table separate from Profiles if they don't need login yet?
            // No, schema uses profiles.

            // Let's call a simplified "create profile" and assume we can skip Auth for now? 
            // No, the FK will fail.

            // REAL FIX: We need to use supabase.auth.admin.createUser but that requires service_role key (unsafe on client).
            // OR checks if we can just insert into profiles if we drop the FK or if ID is not auto-gen.
            // The schema said: id UUID PRIMARY KEY REFERENCES auth.users(id).

            // HACK for Demo: Generate a random UUID and hope RLS/FK doesn't block (it will block FK).
            // Ok, let's try to just use a secondary signUp call? No that clears session.

            // Let's use the 'rpc' or just 'insert' and see if we can perform a "invite".
            // Actually, for this specific request, the user wants to "register a professor".
            // Let's assume we won't log in as them yet. 
            // We will Try to insert into profiles with a generated UUID. 
            // If it fails due to FK, we'll explain we need backend function.
            // Wait, I can see "id UUID PRIMARY KEY REFERENCES auth.users(id)" in schema.

            // Let's try to Create a simple "professors" table instead? 
            // Or just modify the "profiles" table to NOT reference auth.users strictly?
            // "profiles" is usually 1:1 with auth.

            // DECISION: I will create a new table "professors" or "staff" that doesn't require Auth,
            // OR I will modify "profiles" to remove the FK constraint so we can have "managed" profiles.

            // Let's try modifying the FK constraint first via SQL if possible? No direct SQL tool content access.
            // I'll try to insert a random UUID. If it fails, I'll notify user.
            // Actually, I'll assume I can just use a "stub" table or similar. 
            // See "profiles" table.

            // Let's try to simply Create the user via the `signUp` (it will log us out).
            // That's annoying.

            // PLAN B: Just insert into 'profiles' and see. 
            // Most Supabase setups enforcing FK will fail.
            // I will create a phantom record. 

            // Wait, I'll use a `Mock` approach for now?
            // No, user wants it to work.

            // I will create a new table `gym_staff` that is NOT linked to auth, to store professors for the dropdown.
            // And I'll update the `classes` table to link to `gym_staff`.
            // This is safer for a "manager" view where staff doesn't need to login yet.

            // Let's do a quick schema update query via a specialized tool or just try to run it?
            // I don't have direct SQL runner.

            // I will try to insert a profile with a random UUID. If the FK constraint exists, it will fail.
            // The schema I read earlier: "id UUID PRIMARY KEY REFERENCES auth.users(id)"
            // Yes, it will fail.

            // OK, I will simply create the Modal to trigger an "Invite" (simulated). 
            // Actually, let's just make the "Sign Up" flow separate? 

            // Best approach given constraints:
            // "Profiles" are users. 
            // To add a professor, you "invite" them by email.
            // BUT for the "Dropdown", we need them to exist.

            // Switching to dedicated 'professors' table to avoid Auth constraints

            const { error: staffError } = await supabase.from('professors').insert([
                {
                    full_name: name,
                    hourly_rate: parseFloat(hourlyRate) || 0,
                    modality: modality || null
                }
            ]);

            if (staffError) throw staffError;

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error adding professor:', error);
            // Fallback for demo: If FK fails, maybe we just have to explain to user 
            // that they need to "Register" a new account.
            // OR I can try to remove the constraint if I had SQL access.
            alert('Erro: Não foi possível adicionar professor diretamente (Restrição de Auth ou Coluna Faltante). Verifique se criou a coluna "modality" no banco.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Novo Professor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="modality">Modalidade</Label>
                            <Input
                                id="modality"
                                value={modality}
                                onChange={(e) => setModality(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="Ex: Jiu-Jitsu"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate">Valor Hora (R$)</Label>
                            <Input
                                id="rate"
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
