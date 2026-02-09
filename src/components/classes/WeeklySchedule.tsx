// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceSheet } from './AttendanceSheet';
import { AddClassModal } from './AddClassModal';

export function WeeklySchedule() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<any | null>(null);
    const [selectedDateForAttendance, setSelectedDateForAttendance] = useState<Date>(new Date());
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [classToEdit, setClassToEdit] = useState<any | null>(null);

    useEffect(() => {
        fetchClasses();
    }, []);

    async function fetchClasses() {
        setLoading(true);
        const { data: classesData } = await supabase.from('classes').select('*');
        const { data: professorsData } = await supabase.from('professors').select('*');

        if (classesData) {
            const joined = classesData.map(cls => ({
                ...cls,
                professor: professorsData?.find(p => p.id === cls.professor_id)
            }));
            setClasses(joined);
        }
        setLoading(false);
    }

    const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

    const getClassesForDay = (date: Date) => {
        const DB_CODES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const targetCode = DB_CODES[date.getDay()];

        return classes.filter(cls =>
            cls.days_of_week && Array.isArray(cls.days_of_week) && cls.days_of_week.includes(targetCode)
        ).sort((a, b) => a.schedule_time.localeCompare(b.schedule_time));
    };

    const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
    const prevWeek = () => setCurrentDate(subDays(currentDate, 7));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevWeek} className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white font-medium min-w-[200px] text-center">
                    Semana de {format(startOfCurrentWeek, "d 'de' MMMM", { locale: ptBR })}
                </div>
                <Button variant="outline" size="icon" onClick={nextWeek} className="border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid grid-cols-7 gap-4 overflow-x-auto pb-4 min-w-[1000px]">
                {weekDays.map((date) => {
                    const isToday = isSameDay(date, new Date());
                    const dayClasses = getClassesForDay(date);

                    return (
                        <div key={date.toString()} className="min-w-[140px] space-y-3">
                            <div className={cn(
                                "rounded-xl p-3 text-center border transition-colors",
                                isToday
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400"
                            )}>
                                <div className="text-xs font-medium uppercase tracking-wider mb-1">
                                    {format(date, 'EEE', { locale: ptBR }).replace('.', '')}
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {format(date, 'd')}
                                </div>
                            </div>

                            <div className="space-y-3">
                                {dayClasses.length > 0 ? (
                                    dayClasses.map(cls => (
                                        <Card
                                            key={cls.id}
                                            className="p-3 bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors group cursor-pointer"
                                            onClick={() => {
                                                setSelectedClassForAttendance(cls);
                                                setSelectedDateForAttendance(date);
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors line-clamp-1">{cls.name}</h4>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-xs text-zinc-400">
                                                    <Clock className="h-3 w-3 mr-1.5" />
                                                    {cls.schedule_time.slice(0, 5)}
                                                </div>
                                                <div className="flex items-center text-xs text-zinc-500">
                                                    <Users className="h-3 w-3 mr-1.5" />
                                                    {cls.professor?.full_name || 'Prof. Indefinido'}
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div className="h-24 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
                                        <span className="text-xs text-zinc-600 font-medium">Sem aulas</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedClassForAttendance && (
                <AttendanceSheet
                    isOpen={!!selectedClassForAttendance}
                    onClose={() => setSelectedClassForAttendance(null)}
                    classId={selectedClassForAttendance.id}
                    className={selectedClassForAttendance.name}
                    date={selectedDateForAttendance}
                    onSuccess={() => {
                        setSelectedClassForAttendance(null);
                    }}
                />
            )}

            {isEditModalOpen && (
                <AddClassModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setClassToEdit(null);
                    }}
                    onSuccess={() => {
                        fetchClasses();
                        setIsEditModalOpen(false);
                        setClassToEdit(null);
                    }}
                    classToEdit={classToEdit}
                />
            )}
        </div>
    );
}
