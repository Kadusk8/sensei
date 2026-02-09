import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Calendar, TrendingUp, Plus, AlertCircle, CheckCircle2, Wallet, RefreshCcw, ArrowUpRight, ArrowDownLeft, Loader2, FileText, Table as TableIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, isBefore, isToday, addDays, addMonths, setDate } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { AddTransactionModal } from '@/components/financial/AddTransactionModal';
import { exportToPDF, exportToExcel, generateReceipt } from '@/utils/exportUtils';
import { AccountsReceivableList } from '@/components/financial/AccountsReceivableList';
import { BillingAutomationPanel } from '@/components/financial/BillingAutomationPanel';

type Transaction = Database['public']['Tables']['transactions']['Row'];

// Extend Transaction for Ghost objects which might have extra props temporarily
type GhostTransaction = Transaction & {
    fixed_expense_id?: string;
    is_ghost?: boolean;
    phone?: string;
};

interface AccountsPayableListProps {
    transactions: Transaction[];
    onPay: (id: string, currentStatus: string) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

function AccountsPayableList({ transactions, onPay, onEdit, onDelete }: AccountsPayableListProps) {
    // Filter pending expenses
    const pendingExpenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'pending')
        .sort((a, b) => new Date(a.due_date || a.created_at).getTime() - new Date(b.due_date || b.created_at).getTime()); // Sort by Due Date ASC (Oldest/Overdue first)

    const next7DaysTotal = pendingExpenses
        .filter(t => isBefore(new Date(t.due_date || t.created_at), addDays(new Date(), 7)))
        .reduce((acc, t) => acc + t.amount, 0);

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Contas a Pagar
                </CardTitle>
                <CardDescription>
                    Próximos vencimentos
                </CardDescription>

                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-red-200 font-medium">Necessário (7 dias)</span>
                    </div>
                    <span className="text-lg font-bold text-red-400">{formatCurrency(next7DaysTotal)}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-0 min-h-0">
                <div className="space-y-3 mt-2">
                    {pendingExpenses.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-zinc-500 text-sm">Nenhuma conta pendente para este período.</p>
                        </div>
                    ) : (
                        pendingExpenses.map((t) => {
                            const dueDate = new Date(t.due_date || t.created_at);
                            const isOverdue = isBefore(dueDate, startOfDay(new Date()));
                            const isDueToday = isToday(dueDate);

                            return (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/80 transition-colors">
                                    <div className="flex flex-col gap-1">
                                        {t.category.startsWith('[') ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded w-fit mb-1 border border-zinc-700">
                                                    {parseCategory(t.category).category}
                                                </span>
                                                <span className="font-medium text-zinc-200">{parseCategory(t.category).description}</span>
                                            </div>
                                        ) : (
                                            <span className="font-medium text-zinc-200">{t.category}</span>
                                        )}
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={cn(
                                                "flex items-center gap-1 font-medium",
                                                isOverdue ? "text-red-500" : isDueToday ? "text-yellow-500" : "text-zinc-500"
                                            )}>
                                                <Calendar className="h-3 w-3" />
                                                {format(dueDate, 'dd/MM/yyyy')}
                                                {isOverdue && <span className="text-[10px] bg-red-500/10 px-1 rounded ml-1">VENCIDO</span>}
                                                {isDueToday && <span className="text-[10px] bg-yellow-500/10 px-1 rounded ml-1">HOJE</span>}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-white mr-3">{formatCurrency(t.amount)}</span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                                            onClick={() => onEdit(t)}
                                        >
                                            <div className="h-4 w-4">✎</div>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500"
                                            onClick={() => onDelete(t.id)}
                                        >
                                            <div className="h-4 w-4">✕</div>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full"
                                            onClick={() => onPay(t.id, t.status)}
                                            title="Marcar como Pago"
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface ProfessorPayroll {
    id: string;
    name: any;
    classes_per_week: number;
    hourly_rate: number;
    estimated_monthly_total: number;
    last_payment_date?: string;
    is_paid_this_month: boolean;
}

function FinancialStats({ transactions, recurringRevenue }: { transactions: Transaction[], recurringRevenue: number }) {
    const income = transactions
        .filter(t => t.type === 'income' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);

    const profit = income - expense;

    return (
        <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Receita Total</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(income)}</div>
                    <p className="text-xs text-zinc-500 flex items-center mt-1">
                        Total acumulado (Real)
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Despesas</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(expense)}</div>
                    <p className="text-xs text-zinc-500 flex items-center mt-1">
                        Total acumulado
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Lucro Líquido</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn("text-2xl font-bold", profit >= 0 ? "text-emerald-500" : "text-red-500")}>
                        {formatCurrency(profit)}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Receita Recorrente</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <RefreshCcw className="h-4 w-4 text-purple-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{formatCurrency(recurringRevenue)}</div>
                    <p className="text-xs text-zinc-500 flex items-center mt-1">
                        Estimativa Mensal (MRR)
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

function PayrollTable({ payrollData, onPay }: { payrollData: ProfessorPayroll[], onPay: (prof: ProfessorPayroll) => void }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 col-span-2">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Folha de Pagamento (Estimativa)
                </CardTitle>
                <CardDescription>
                    Calculado com base nas chamadas realizadas este mês.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800 text-zinc-400">
                            <tr>
                                <th className="h-10 px-4 text-left font-medium">Professor</th>
                                <th className="h-10 px-4 text-center font-medium">Aulas Realizadas (Mês)</th>
                                <th className="h-10 px-4 text-right font-medium">Valor Hora</th>
                                <th className="h-10 px-4 text-right font-medium">Total a Pagar</th>
                                <th className="h-10 px-4 text-center font-medium">Status (Mês Atual)</th>
                                <th className="h-10 px-4 text-right font-medium">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-zinc-500">Nenhum professor com aulas cadastradas.</td>
                                </tr>
                            ) : (
                                payrollData.map((prof) => (
                                    <tr key={prof.id} className="border-t border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 font-medium text-white">{prof.name}</td>
                                        <td className="p-4 text-center text-zinc-300">
                                            <Badge variant="secondary">{prof.classes_per_week}</Badge>
                                        </td>
                                        <td className="p-4 text-right text-zinc-300">{formatCurrency(prof.hourly_rate)}</td>
                                        <td className="p-4 text-right font-bold text-white">{formatCurrency(prof.estimated_monthly_total)}</td>
                                        <td className="p-4 text-center">
                                            {prof.is_paid_this_month ? (
                                                <Badge className="bg-green-500/20 text-green-500 border-0">Pago ✅</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Pendente</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!prof.is_paid_this_month && (
                                                <Button
                                                    size="sm"
                                                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => onPay(prof)}
                                                >
                                                    Pagar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    onToggleStatus: (id: string, currentStatus: string) => void;
}

function RecentTransactions({ transactions, onToggleStatus }: RecentTransactionsProps) {
    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <RefreshCcw className="h-5 w-5 text-zinc-400" />
                    Transações Recentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-3">
                                <DollarSign className="h-6 w-6 text-zinc-500" />
                            </div>
                            <p className="text-zinc-500">Nenhuma transação encontrada.</p>
                        </div>
                    ) : (
                        transactions.slice(0, 10).map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group border border-transparent hover:border-zinc-800">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center border",
                                        t.type === 'income'
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                            : "bg-red-500/10 border-red-500/20 text-red-500"
                                    )}>
                                        {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        {t.category.startsWith('[') ? (
                                            <>
                                                <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1 rounded w-fit mb-0.5">
                                                    {parseCategory(t.category).category}
                                                </span>
                                                <span className={cn("font-medium", t.type === 'income' ? 'text-white' : 'text-zinc-200')}>
                                                    {parseCategory(t.category).description}
                                                </span>
                                            </>
                                        ) : (
                                            <span className={cn("font-medium", t.type === 'income' ? 'text-white' : 'text-zinc-200')}>{t.category}</span>
                                        )}
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(t.created_at), 'dd/MM/yyyy')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <span className={cn("font-bold", t.type === 'income' ? 'text-emerald-500' : 'text-red-500')}>
                                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {t.type === 'income' && t.status === 'paid' && (
                                            <button
                                                className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all duration-200 border bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500"
                                                onClick={() => generateReceipt(t)}
                                                title="Gerar Recibo PDF"
                                            >
                                                RECIBO
                                            </button>
                                        )}
                                        <button
                                            className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider transition-all duration-200 border",
                                                t.status === 'paid'
                                                    ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30"
                                                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/20"
                                            )}
                                            onClick={() => onToggleStatus(t.id, t.status)}
                                            title="Clique para alterar o status"
                                        >
                                            {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

interface CashFlowChartProps {
    transactions: Transaction[];
    pendingTransactions: Transaction[];
    recurringRevenue: number;
}

function CashFlowChart({ transactions, pendingTransactions, recurringRevenue }: CashFlowChartProps) {
    // Merge datasets: Current View (filtered) + Future Pending (unfiltered)
    // We deduplicate by ID to avoid double counting if a pending item is also in the current view
    const allData = [...transactions];
    pendingTransactions.forEach(pt => {
        if (!allData.find(t => t.id === pt.id)) {
            allData.push(pt);
        }
    });

    const dataMap = allData.reduce((acc, t) => {
        // Use due_date for pending transactions to correct position them in timeline
        const dateObj = t.due_date ? new Date(t.due_date) : new Date(t.created_at);
        const dateKey = format(dateObj, 'dd/MM');

        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: dateKey,
                rawDate: dateObj,
                income: 0,
                incomePending: 0,
                expense: 0,
                expensePending: 0
            };
        }

        if (t.type === 'income') {
            if (t.status === 'paid') acc[dateKey].income += t.amount;
            else acc[dateKey].incomePending += t.amount;
        } else {
            if (t.status === 'paid') acc[dateKey].expense += t.amount;
            else acc[dateKey].expensePending += t.amount;
        }
        return acc;
    }, {} as Record<string, any>);

    // Add Projections for the next 3 months (representing MRR)
    // We place it on the 5th of usually to represent "payment week"
    if (recurringRevenue > 0) {
        const today = new Date();
        for (let i = 1; i <= 3; i++) {
            const futureDate = setDate(addMonths(today, i), 5); // 5th of next months
            const dateKey = format(futureDate, 'dd/MM');

            if (!dataMap[dateKey]) {
                dataMap[dateKey] = {
                    date: dateKey,
                    rawDate: futureDate,
                    income: 0,
                    incomePending: 0,
                    expense: 0,
                    expensePending: 0
                };
            }
            // Add MRR to incomePending (Projected)
            dataMap[dateKey].incomePending += recurringRevenue;
        }
    }

    const chartData = Object.values(dataMap)
        .sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime());

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-zinc-400" />
                    Fluxo de Caixa (Realizado + Previsto + MRR)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$ ${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#27272a' }}
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                formatter={(value: any, name: any) => [formatCurrency(value || 0), name] as [string, string]}
                            />
                            <Bar dataKey="income" stackId="a" name="Receitas (Real)" fill="#10b981" />
                            <Bar dataKey="incomePending" stackId="a" name="Receitas (Prev)" fill="#059669" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" stackId="b" name="Despesas (Real)" fill="#ef4444" />
                            <Bar dataKey="expensePending" stackId="b" name="Despesas (Prev)" fill="#b91c1c" fillOpacity={0.5} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}


function parseCategory(raw: string) {
    const match = raw.match(/^\[(.*?)\]\s*(.*)/);
    return match ? { category: match[1], description: match[2] } : { category: 'Geral', description: raw };
}

function ExpenseBreakdownChart({ transactions, pendingTransactions }: { transactions: Transaction[], pendingTransactions: Transaction[] }) {
    // Merge Realized and Pending for a complete view of expenses
    const allData = [...transactions];
    pendingTransactions.forEach(pt => {
        if (!allData.find(t => t.id === pt.id)) {
            allData.push(pt);
        }
    });

    const data = allData
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const { category } = parseCategory(t.category);
            const existing = acc.find(c => c.name === category);
            if (existing) {
                existing.value += t.amount;
            } else {
                acc.push({ name: category, value: t.amount });
            }
            return acc;
        }, [] as { name: any; value: number }[])
        .sort((a, b) => b.value - a.value);

    // Filter out 0 or negative if any (shouldn't happen for expenses unless refund)
    const activeData = data.filter(d => d.value > 0);

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-zinc-400" />
                    Despesas por Categoria
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {activeData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                        Nenhuma despesa registrada.
                    </div>
                ) : (
                    <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {activeData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(value || 0) as string}
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function Financial() {
    const [tab, setTab] = useState<'dashboard' | 'payroll' | 'transactions'>('dashboard');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [activeStudents, setActiveStudents] = useState<any[]>([]);
    const [payrollData, setPayrollData] = useState<ProfessorPayroll[]>([]);
    const [recurringRevenue, setRecurringRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

    const [dateFilter, setDateFilter] = useState('current_month');
    const [dateRange, setDateRange] = useState({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
    const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);

    useEffect(() => {
        const calculateDateRange = () => {

            const now = new Date();
            let start = startOfMonth(now);
            let end = endOfMonth(now);

            switch (dateFilter) {
                case 'current_month':
                    // Default
                    break;
                case 'last_month':
                    start = startOfMonth(subMonths(now, 1));
                    end = endOfMonth(subMonths(now, 1));
                    break;
                case 'last_3_months':
                    start = startOfMonth(subMonths(now, 2)); // Current + 2 prev
                    break;
                case 'last_6_months':
                    start = startOfMonth(subMonths(now, 5));
                    break;
                case 'year_to_date':
                    start = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            return { start, end };
        };

        setDateRange(calculateDateRange());
    }, [dateFilter]);

    useEffect(() => {
        loadAllData();

        // Subscribe to relevant tables
        const subTransactions = supabase
            .channel('financial_transactions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, loadAllData)
            .subscribe();

        return () => {
            subTransactions.unsubscribe();
        };
    }, [dateRange]); // Reload when date range changes

    const loadAllData = async () => {
        try {
            await Promise.all([
                fetchTransactions(),
                fetchPendingTransactions(),
                calculateRecurringRevenue(),
                calculatePayroll(),
                calculateRecurringRevenue(),
                calculatePayroll(),
                fetchFixedExpenses(),
                fetchActiveStudents()
            ]);
        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFixedExpenses = async () => {
        const { data } = await supabase.from('fixed_expenses').select('*').eq('active', true);
        if (data) setFixedExpenses(data);
    };

    const fetchActiveStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select(`
                id, full_name, due_day, phone,
                plans ( name, price )
            `)
            .eq('status', 'active');
        if (data) setActiveStudents(data);
    };

    const fetchTransactions = async () => {
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .gte('created_at', dateRange.start.toISOString())
            .lte('created_at', dateRange.end.toISOString())
            .order('created_at', { ascending: false });
        if (data) setTransactions(data);
    };

    const fetchPendingTransactions = async () => {
        // Fetch ALL pending expenses regardless of date
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'expense')
            .eq('status', 'pending')
            .order('due_date', { ascending: true }); // Vencimento mais próximo primeiro

        if (data) setPendingTransactions(data);
    };

    const calculateRecurringRevenue = async () => {
        // Fetch active students and their plans
        const { data: students } = await supabase
            .from('students')
            .select('plan_id, plans (price)')
            .eq('status', 'active');

        if (students) {
            const total = students.reduce((acc, student) => {
                // @ts-ignore - supabase types join
                const price = student.plans?.price || 0;
                return acc + price;
            }, 0);
            setRecurringRevenue(total);
        }
    };

    const calculatePayroll = async () => {
        // 1. Fetch professors
        const { data: professors } = await supabase.from('professors').select('*').returns<Database['public']['Tables']['professors']['Row'][]>();
        if (!professors) return;

        // 2. Fetch CONFIRMED class sessions for this PERIOD
        const start = dateRange.start.toISOString();
        const end = dateRange.end.toISOString();

        const { data: sessions } = await supabase
            .from('class_sessions')
            .select('professor_id')
            .gte('date', start)
            .lte('date', end)
            .returns<{ professor_id: string }[]>();

        // 3. Fetch payments in this PERIOD to check status
        const { data: payments } = await supabase
            .from('transactions')
            .select('related_user_id')
            .eq('type', 'expense')
            .gte('created_at', start)
            .lte('created_at', end)
            .returns<{ related_user_id: string }[]>();

        const paidUserIds = new Set(payments?.map(p => p.related_user_id) || []);

        const payroll: ProfessorPayroll[] = professors.map(prof => {
            // Count actual sessions for this professor in the current month
            const actualClassesCount = sessions?.filter(s => s.professor_id === prof.id).length || 0;

            // Use the correct field 'hourly_rate' (fixing potential bug if it was value_per_hour)
            const rate = prof.hourly_rate || 0; // fallback to 0 if null

            // Total based on ACTUAL classes given
            // If the user wants an estimate based on schedule, we could keep the old logic too, 
            // but for "Payment" we want accuracy.
            const total = actualClassesCount * rate;

            return {
                id: prof.id,
                name: prof.full_name,
                classes_per_week: actualClassesCount, // Reusing this field to show Monthly Count
                hourly_rate: rate,
                estimated_monthly_total: total,
                is_paid_this_month: paidUserIds.has(prof.id)
            };
        });

        setPayrollData(payroll);
    };

    // Logic to generate ghost transactions
    const ghostTransactions = useMemo(() => {
        if (!fixedExpenses.length || !dateRange?.start) return [];

        const ghosts: any[] = [];
        const monthStart = dateRange.start;
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        fixedExpenses.forEach(fe => {
            const finalDay = Math.min(fe.due_day, lastDayOfMonth);
            const targetDate = new Date(year, month, finalDay);
            const dateStr = format(targetDate, 'yyyy-MM-dd');

            // Check if this Fixed Expense already has a Real Transaction in this month
            // We check by fixed_expense_id or fuzzy match for legacy data
            const exists = transactions.some(t => {
                const tDate = t.due_date || t.created_at;
                if (!tDate) return false;

                const sameMonth = tDate.substring(0, 7) === dateStr.substring(0, 7);
                if (!sameMonth) return false;

                // 1. Strict Link Match
                if ((t as GhostTransaction).fixed_expense_id === fe.id) return true;

                // 2. Fuzzy Match (for existing transactions added before this feature)
                // Matches if Same Amount AND (Category matches OR Description matches)
                if (!(t as GhostTransaction).fixed_expense_id) {
                    const sameAmount = Math.abs(t.amount - fe.amount) < 0.01;
                    const normalizedTCat = t.category.toLowerCase();
                    const normalizedFeCat = fe.category.toLowerCase();
                    const normalizedFeDesc = fe.description.toLowerCase();

                    // Check if transaction category string contains either the fixed category or description
                    const contentMatch = normalizedTCat.includes(normalizedFeCat) || normalizedTCat.includes(normalizedFeDesc);

                    if (sameAmount && contentMatch) return true;
                }

                return false;
            });

            if (!exists) {
                ghosts.push({
                    id: `ghost-${fe.id}-${dateStr}`, // Unique ID for ghost
                    category: `[${fe.category}] ${fe.description}`,
                    amount: fe.amount,
                    type: 'expense',
                    status: 'pending', // Ghost is always pending
                    created_at: new Date(dateStr + 'T12:00:00').toISOString(), // Use due date as creation for sorting
                    due_date: dateStr,
                    is_ghost: true, // Flag to identify
                    fixed_expense_id: fe.id
                } as GhostTransaction);
            }
        });
        return ghosts;
    }, [fixedExpenses, transactions, dateRange]);

    // Combine actual pending transactions with ghost transactions for display
    const allPendingTransactions = useMemo(() => {
        // Filter out actual pending transactions that are already represented by a ghost (shouldn't happen if fixed_expense_id is used correctly)
        // Or, more simply, just combine and sort.
        const combined = [...pendingTransactions, ...ghostTransactions];
        // Sort by due_date, then by created_at for consistency
        return combined.sort((a, b) => {
            const dateA = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
            const dateB = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
            return dateA.getTime() - dateB.getTime();
        });
    }, [pendingTransactions, ghostTransactions]);

    // Ghost Income Transactions (Students who haven't paid yet this month)
    const ghostIncomeTransactions = useMemo(() => {
        if (!activeStudents.length || !dateRange?.start) return [];

        const ghosts: any[] = [];
        // We only look at current or past months for "Pending Income".
        const monthStart = dateRange.start;
        const year = monthStart.getFullYear();
        const month = monthStart.getMonth();
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        activeStudents.forEach(student => {
            if (!student.plans) return; // No plan, no charge

            // Determine Due Date
            const dueDay = student.due_day || 10;
            const finalDay = Math.min(dueDay, lastDayOfMonth);
            const targetDate = new Date(year, month, finalDay);
            const dateStr = format(targetDate, 'yyyy-MM-dd');

            // Check if PAID this month
            const isPaid = transactions.some(t => {
                if (t.type !== 'income') return false;
                const tDate = t.created_at; // Date paid
                const sameMonth = tDate.startsWith(format(monthStart, 'yyyy-MM'));

                // Strict check by ID
                if (t.related_user_id === student.id && sameMonth) return true;

                // Fuzzy check (backup)
                return false;
            });

            if (!isPaid) {
                ghosts.push({
                    id: `ghost-student-${student.id}-${dateStr}`,
                    category: `[Mensalidade] ${student.full_name}`,
                    amount: student.plans.price,
                    type: 'income',
                    status: 'pending',
                    created_at: new Date(dateStr + 'T10:00:00').toISOString(),
                    due_date: dateStr,
                    related_user_id: student.id,
                    phone: student.phone, // Add phone for WhatsApp billing
                    is_ghost: true
                });
            }
        });

        return ghosts;
    }, [activeStudents, transactions, dateRange]);


    const handleReceiveStudentPayment = async (ghost: any) => {
        if (!confirm(`Confirmar recebimento de ${formatCurrency(ghost.amount)} de ${ghost.category}?`)) return;

        try {
            const { error } = await (supabase.from('transactions') as any).insert([{
                category: ghost.category,
                amount: ghost.amount,
                type: 'income',
                status: 'paid',
                created_at: new Date().toISOString(),
                related_user_id: ghost.related_user_id
            } as any]);

            if (error) throw error;
            loadAllData();
            alert('Recebimento registrado com sucesso!');
        } catch (error) {
            console.error('Error receiving payment:', error);
            alert('Erro ao registrar recebimento.');
        }
    };


    const handlePayProfessor = async (prof: ProfessorPayroll) => {
        if (!confirm(`Confirmar pagamento de ${formatCurrency(prof.estimated_monthly_total)} para ${prof.name}?`)) return;

        try {
            const { error } = await (supabase.from('transactions') as any).insert([{
                type: 'expense',
                category: `Pagamento Professor - ${prof.name}`,
                amount: prof.estimated_monthly_total,
                status: 'paid',
                date: new Date().toISOString(),
                related_user_id: prof.id // Link transaction to professor
            } as any]);

            if (error) throw error;

            // Data will auto-refresh due to subscription, but we can force it
            loadAllData();
            alert('Pagamento registrado com sucesso!');
        } catch (error) {
            console.error('Error paying professor:', error);
            alert('Erro ao registrar pagamento.');
        }
    };

    const handleToggleTransactionStatus = async (id: string, currentStatus: string) => {
        if (id.startsWith('ghost-')) {
            const ghost = ghostTransactions.find(g => g.id === id);
            if (!ghost) return;

            // Insert real transaction as PAID
            try {
                const { error } = await (supabase.from('transactions') as any).insert([{
                    category: ghost.category,
                    amount: ghost.amount,
                    type: 'expense',
                    status: 'paid',
                    fixed_expense_id: ghost.fixed_expense_id,
                    created_at: new Date().toISOString(), // Paid NOW
                    due_date: ghost.due_date
                } as any]);
                if (error) throw error;
                loadAllData();
                alert('Despesa fixa registrada e paga com sucesso!');
            } catch (error) {
                console.error('Error paying ghost transaction:', error);
                alert('Erro ao registrar e pagar despesa fixa.');
            }
            return;
        }

        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';

        try {
            const { error } = await (supabase.from('transactions') as any)
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // If moving back to pending, we should probably refetch to get it sorted correctly or add it manually
            // Simpler to just let loadAllData handle it via subscription or re-fetch
            loadAllData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status.');
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
        try {
            const { error } = await supabase.from('transactions').delete().eq('id', id);
            if (error) throw error;
            loadAllData();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir.');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full pt-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Financeiro</h2>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-md px-1 mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                const allData = [...transactions];
                                pendingTransactions.forEach(pt => {
                                    if (!allData.find(t => t.id === pt.id)) {
                                        allData.push(pt);
                                    }
                                });

                                const incomePaid = allData.filter(t => t.type === 'income' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
                                const incomePending = allData.filter(t => t.type === 'income' && t.status !== 'paid').reduce((acc, t) => acc + t.amount, 0);
                                const expensePaid = allData.filter(t => t.type === 'expense' && t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
                                const expensePending = allData.filter(t => t.type === 'expense' && t.status !== 'paid').reduce((acc, t) => acc + t.amount, 0);

                                exportToPDF(allData, dateRange, { incomePaid, incomePending, expensePaid, expensePending });
                            }}
                            title="Exportar PDF"
                        >
                            <FileText className="h-4 w-4 text-zinc-400 hover:text-red-400 transition-colors" />
                        </Button>
                        <div className="w-px h-4 bg-zinc-800 mx-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                                const allData = [...transactions];
                                pendingTransactions.forEach(pt => {
                                    if (!allData.find(t => t.id === pt.id)) {
                                        allData.push(pt);
                                    }
                                });
                                exportToExcel(allData);
                            }}
                            title="Exportar Excel"
                        >
                            <TableIcon className="h-4 w-4 text-zinc-400 hover:text-green-500 transition-colors" />
                        </Button>
                    </div>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-white">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                            <SelectItem value="current_month">Este Mês</SelectItem>
                            <SelectItem value="last_month">Mês Passado</SelectItem>
                            <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                            <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                            <SelectItem value="year_to_date">Este Ano</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={() => setIsTransactionModalOpen(true)} className="bg-primary text-black hover:bg-primary/90 mr-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Despesa
                    </Button>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <Button variant={tab === 'dashboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('dashboard')}>Visão Geral</Button>
                        <Button variant={tab === 'payroll' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('payroll')}>Folha</Button>
                        <Button variant={tab === 'transactions' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTab('transactions')}>Transações</Button>
                    </div>
                </div>
            </div>

            {tab === 'dashboard' && (
                <div className="space-y-4">
                    <FinancialStats transactions={transactions} recurringRevenue={recurringRevenue} />

                    <BillingAutomationPanel
                        transactions={[...ghostIncomeTransactions, ...pendingTransactions]}
                        onRefresh={loadAllData}
                    />

                    <div className="grid gap-4 md:grid-cols-4 h-[400px]">
                        <div className="col-span-2 h-full min-h-0">
                            <CashFlowChart
                                transactions={transactions}
                                pendingTransactions={pendingTransactions}
                                recurringRevenue={recurringRevenue}
                            />
                        </div>
                        <div className="col-span-1 h-full min-h-0">
                            <AccountsReceivableList
                                transactions={[...ghostIncomeTransactions]}
                                onReceive={handleReceiveStudentPayment}
                            />
                        </div>
                        <div className="col-span-1 h-full min-h-0">
                            <AccountsPayableList
                                transactions={allPendingTransactions}
                                onPay={handleToggleTransactionStatus}
                                onEdit={(t) => { setTransactionToEdit(t); setIsTransactionModalOpen(true); }}
                                onDelete={handleDeleteTransaction}
                            />
                        </div>
                    </div>



                    <div className="grid gap-4 md:grid-cols-3 h-[320px]">
                        <div className="col-span-1 h-full min-h-0">
                            <ExpenseBreakdownChart transactions={transactions} pendingTransactions={pendingTransactions} />
                        </div>
                        <div className="col-span-2 h-full min-h-0">
                            <PayrollTable payrollData={payrollData} onPay={handlePayProfessor} />
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <RecentTransactions transactions={transactions} onToggleStatus={handleToggleTransactionStatus} />
                    </div>
                </div>
            )}

            {tab === 'payroll' && <PayrollTable payrollData={payrollData} onPay={handlePayProfessor} />}

            {tab === 'transactions' && (
                <div className="grid gap-4">
                    <RecentTransactions transactions={transactions} onToggleStatus={handleToggleTransactionStatus} />
                </div>
            )}

            <AddTransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => {
                    setIsTransactionModalOpen(false);
                    setTransactionToEdit(null);
                }}
                onSuccess={loadAllData}
                transactionToEdit={transactionToEdit}
            />
        </div>
    );
}
