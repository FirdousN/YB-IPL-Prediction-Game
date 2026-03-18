import { redirect } from 'next/navigation';

export default function DashboardPage() {
    // Simply redirect to the main matches page for now
    redirect('/site/matches');
}
