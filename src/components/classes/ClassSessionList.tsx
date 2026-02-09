// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, ChevronRight, Users, CheckCircle2 } from 'lucide-react';
import { format, isSameDay, startOfWeek, addDays, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { AttendanceSheet } from './AttendanceSheet';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database';

type Class = Database['public']['Tables']['classes']['Row'];
type Professor = Database['public']['Tables']['professors']['Row'];

interface ClassWithDetails extends Class {
    professor?: Professor;
}

export function ClassSessionList({ selectedDate }: { selectedDate: Date }) {
    const [classes, setClasses] = useState<ClassWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<ClassWithDetails | null>(null);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

    useEffect(() => {
        fetchClassesForDate();
    }, [selectedDate]);

    const fetchClassesForDate = async () => {
        setLoading(true);
        try {
            // 1. Fetch all classes
            // In a real optimized app, we would filter by day of week in the query if structure allows,
            // or fetch all and filter in JS if dataset is small (it usually is for classes schedule).
            const { data, error } = await supabase
                .from('classes')
                .select('*, professor:professors(*)') as any;

            if (error) throw error;

            // 2. Filter classes that happen on 'selectedDate' day of week
            // days_of_week is typically ['Monday', 'Wednesday', ...] or [1, 3, 5]
            // Let's assume database stores names in English or index.
            // Based on previous code artifacts (AddPlanModal), it likely stores strings.
            // Let's check typical 'days_of_week' usage.
            // Current day name in English:
            const dayName = format(selectedDate, 'EEEE'); // 'Monday'

            // Map Portuguese to English if needed or handle logic.
            // Let's assume the DB stores English names like 'Monday', 'Tuesday' etc.
            // OR checks against index. Let's do a loose filter first.

            const dayIndex = getDay(selectedDate); // 0 = Sunday, 1 = Monday...
            // Database uses 3-letter codes: Mon, Tue, Wed, Thu, Fri, Sat, Sun
            const dbDayCodes = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const targetDayCode = dbDayCodes[dayIndex];

            console.log('--- DEBUG START ---');
            console.log('Selected Date:', selectedDate);
            console.log('Target Day Code:', targetDayCode);
            console.log('Raw Data size:', data?.length);
            console.log('First Item:', data?.[0]);
            console.log('First Item Days:', data?.[0]?.days_of_week);

            const filtered = (data || []).filter((c: any) => {
                if (!c.days_of_week) return false;
                if (Array.isArray(c.days_of_week)) {
                    // Check if the array includes the boolean code for today
                    const match = c.days_of_week.includes(targetDayCode);
                    console.log(`Checking ${c.name}: Days=[${c.days_of_week}] vs Target=[${targetDayCode}] -> Match=${match}`);
                    return match;
                }
                return false;
            });
            console.log('filtered size:', filtered.length);
            console.log('--- DEBUG END ---');

            // Sort by time
            filtered.sort((a: any, b: any) => a.schedule_time.localeCompare(b.schedule_time));

            setClasses(filtered);

        } catch (error) {
            console.error('Error fetching classes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAttendance = (cls: ClassWithDetails) => {
        setSelectedClass(cls);
        setIsAttendanceOpen(true);
    };

    if (loading) {
        return <div className="text-zinc-500 text-sm py-4">Carregando turma...</div>;
    }

    if (classes.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500">Nenhuma aula agendada para este dia.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {classes.map((cls) => (
                <div
                    key={cls.id}
                    className="group bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-700 transition-all cursor-pointer"
                    onClick={() => handleOpenAttendance(cls)}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-zinc-800 flex flex-col items-center justify-center border border-zinc-700 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                            <span className="text-lg font-bold text-white">{cls.schedule_time.slice(0, 5)}</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg group-hover:text-primary transition-colors">{cls.name}</h4>
                            <p className="text-zinc-400 text-sm flex items-center gap-2">
                                <Users className="h-3 w-3" />
                                Prof. {cls.professor?.full_name || 'Sem professor'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-green-600/20 hover:border-green-600 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600 transition-all"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Chamada
                        </Button>
                    </div>
                </div>
            ))}

            {selectedClass && (
                <AttendanceSheet
                    isOpen={isAttendanceOpen}
                    onClose={() => setIsAttendanceOpen(false)}
                    classId={selectedClass.id}
                    className={selectedClass.name}
                    date={selectedDate}
                    onSuccess={() => {
                        // Maybe verify checks
                        // reload
                    }}
                />
            )}
        </div>
    );
}
