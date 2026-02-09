import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';

export function TodaysClasses() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchClasses() {
            try {
                // Get current day name in English to match DB format (Mon, Tue...) OR assume we used the short format in schema
                // Based on AddStudentModal, we saw 'Monday', 'Mon' mixed.
                // Let's get the current day short code.
                const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // e.g., "Mon"
                // Or "Monday" if that's what we need, but let's try wildcard match for safety

                const { data } = await supabase
                    .from('classes')
                    .select('*')
                    .order('schedule_time');

                // Filter client side because of array column
                // Assuming days_of_week is text[] or text.
                if (data) {
                    const todaysClasses = data.filter((c: any) => {
                        if (!c.days_of_week) return false;
                        // Check if array contains "Mon" or "Monday" etc.
                        return c.days_of_week.some((d: string) => d.startsWith(today));
                    });
                    setClasses(todaysClasses);
                }
            } catch (error) {
                console.error('Error fetching classes:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchClasses();
    }, []);

    return (
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Aulas de Hoje ({format(new Date(), "EEEE", { locale: ptBR })})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-zinc-500">Carregando aulas...</p>
                ) : classes.length === 0 ? (
                    <p className="text-zinc-500 py-4">Nenhuma aula agendada para hoje.</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {classes.map((cls) => (
                            <div key={cls.id} className="flex items-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">{cls.name}</p>
                                    <p className="text-sm text-zinc-400">
                                        {cls.schedule_time?.substring(0, 5)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
