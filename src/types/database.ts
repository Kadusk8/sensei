export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'admin' | 'professor' | 'secretary'
                    full_name: string
                    avatar_url: string | null
                    hourly_rate: number
                    modality?: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    role?: 'admin' | 'professor'
                    full_name: string
                    avatar_url?: string | null
                    hourly_rate?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    role: 'admin' | 'professor' | 'secretary'
                    full_name?: string
                    avatar_url?: string | null
                    hourly_rate?: number
                    created_at?: string
                }
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    price: number
                    weekly_limit: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    price: number
                    weekly_limit: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    price?: number
                    weekly_limit?: number
                    created_at?: string
                }
            }
            students: {
                Row: {
                    id: string
                    full_name: string
                    phone: string | null
                    email: string | null
                    avatar_url: string | null
                    plan_id: string | null
                    status: 'active' | 'debt' | 'inactive'
                    modality?: string | null
                    belt?: string | null
                    degrees?: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    phone?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    plan_id?: string | null
                    status?: 'active' | 'debt' | 'inactive'
                    belt?: string | null
                    degrees?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    phone?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    plan_id?: string | null
                    status?: 'active' | 'debt' | 'inactive'
                    belt?: string | null
                    degrees?: number | null
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    status: 'paid' | 'pending' | 'overdue'
                    due_date: string | null
                    related_user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    type: 'income' | 'expense'
                    category: string
                    amount: number
                    status?: 'paid' | 'pending' | 'overdue'
                    due_date?: string | null
                    related_user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    type?: 'income' | 'expense'
                    category?: string
                    amount?: number
                    status?: 'paid' | 'pending' | 'overdue'
                    due_date?: string | null
                    related_user_id?: string | null
                    created_at?: string
                }
            },
            products: {
                Row: {
                    id: string
                    name: string
                    price: number
                    stock_quantity: number | null
                    image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    price: number
                    stock_quantity?: number | null
                    image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    price?: number
                    stock_quantity?: number | null
                    image_url?: string | null
                    created_at?: string
                }
            },
            categories: {
                Row: {
                    id: string
                    name: string
                    type: 'income' | 'expense'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'income' | 'expense'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'income' | 'expense'
                    created_at?: string
                }
            },
            fixed_expenses: {
                Row: {
                    id: string
                    category: string
                    description: string
                    amount: number
                    due_day: number
                    active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    category: string
                    description: string
                    amount: number
                    due_day: number
                    active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    category?: string
                    description?: string
                    amount?: number
                    due_day?: number
                    active?: boolean
                    created_at?: string
                }
            },
            attendance: {
                Row: {
                    id: string
                    student_id: string
                    class_id: string
                    date: string
                    present: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    class_id: string
                    date: string
                    present?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    class_id?: string
                    date?: string
                    present?: boolean
                    created_at?: string
                }
            },
            professors: {
                Row: {
                    id: string
                    full_name: string
                    modality: string | null
                    hourly_rate: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    modality?: string | null
                    hourly_rate?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    modality?: string | null
                    hourly_rate?: number | null
                    created_at?: string
                }
            },
            classes: {
                Row: {
                    id: string
                    name: string
                    schedule_time: string
                    professor_id: string | null
                    days_of_week: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    schedule_time: string
                    professor_id?: string | null
                    days_of_week?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    schedule_time?: string
                    professor_id?: string | null
                    days_of_week?: string[] | null
                    created_at?: string
                }
            },
            class_sessions: {
                Row: {
                    id: string
                    class_id: string
                    date: string
                    professor_id: string | null
                    status: 'scheduled' | 'investigating' | 'completed' | 'canceled'
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    class_id: string
                    date: string
                    professor_id?: string | null
                    status?: 'scheduled' | 'investigating' | 'completed' | 'canceled'
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    class_id?: string
                    date?: string
                    professor_id?: string | null
                    status?: 'scheduled' | 'investigating' | 'completed' | 'canceled'
                    notes?: string | null
                    created_at?: string
                }
            },
            student_graduations: {
                Row: {
                    id: string
                    student_id: string
                    belt: string
                    degrees: number
                    promotion_date: string
                    professor_id: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    student_id: string
                    belt: string
                    degrees: number
                    promotion_date: string
                    professor_id?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    student_id?: string
                    belt?: string
                    degrees?: number
                    promotion_date?: string
                    professor_id?: string | null
                    notes?: string | null
                    created_at?: string
                }
            },
            gym_info: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
