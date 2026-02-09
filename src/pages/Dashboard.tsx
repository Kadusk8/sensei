
import { KPICards } from '../components/dashboard/KPICards';
import { RetentionChart } from '../components/dashboard/RetentionChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { TodaysClasses } from '../components/dashboard/TodaysClasses';

export function Dashboard() {
    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h2>
            </div>

            <TodaysClasses />
            <KPICards />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <RetentionChart />
                <ActivityFeed />
            </div>
        </div>
    );
}
