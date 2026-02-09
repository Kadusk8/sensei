
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
    { name: 'Mon', total: 145 },
    { name: 'Tue', total: 132 },
    { name: 'Wed', total: 156 },
    { name: 'Thu', total: 142 },
    { name: 'Fri', total: 128 },
    { name: 'Sat', total: 98 },
    { name: 'Sun', total: 45 },
];

export function RetentionChart() {
    return (
        <Card className="col-span-4 bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white">Frequência Semanal</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: '#27272a' }}
                        />
                        <Bar
                            dataKey="total"
                            fill="#DC2626"
                            radius={[4, 4, 0, 0]}
                            className="fill-primary"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
