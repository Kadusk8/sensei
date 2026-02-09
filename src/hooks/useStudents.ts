import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Student = Database['public']['Tables']['students']['Row'] & {
    plans?: Database['public']['Tables']['plans']['Row'] | null
};

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    async function fetchStudents() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('students')
                .select(`
          *,
          plans (
            name,
            weekly_limit
          )
        `)
                .order('full_name');

            if (error) throw error;
            setStudents(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return { students, loading, error, refetch: fetchStudents };
}
