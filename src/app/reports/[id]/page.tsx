
'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReportDetail = {
  metric: string;
  value: string;
  status?: 'Good' | 'Fair' | 'Poor' | 'Optimal' | 'Alert';
};

// Placeholder data for a single report
const reportDetailsData: ReportDetail[] = [
  { metric: 'Overall Crop Health', value: '85%', status: 'Good' },
  { metric: 'Damage Assessment', value: 'Minimal Leaf Spotting', status: 'Optimal' },
  { metric: 'Yield Prediction', value: '2.5 tons/acre', status: 'Good' },
  { metric: 'Pest & Disease Report', value: 'No significant threats detected', status: 'Optimal' },
  { metric: 'Soil Health', value: 'pH 6.8, 70% Moisture', status: 'Good' },
  { metric: 'Canopy Density', value: '65%', status: 'Fair' },
  { metric: 'Water Stress', value: 'Low', status: 'Optimal' },
  { metric: 'Nutrient Levels', value: 'Nitrogen: High, Phosphorus: OK', status: 'Alert' },
];

const statusColors = {
    Good: 'text-green-600',
    Fair: 'text-yellow-600',
    Poor: 'text-red-600',
    Optimal: 'text-blue-600',
    Alert: 'text-orange-600',
}

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch report data based on params.id
  const reportDate = "02/07/2024 Morning"; // Placeholder

  const DetailItem = ({ item }: { item: ReportDetail }) => (
    <div className="flex justify-between items-center py-3 border-b">
      <p className="text-sm font-medium text-muted-foreground">{item.metric}</p>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{item.value}</p>
        {item.status && (
            <p className={`text-xs font-bold ${statusColors[item.status] || 'text-muted-foreground'}`}>
                {item.status.toUpperCase()}
            </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col bg-background font-body text-foreground">
      <header className="flex items-center justify-between p-4 pb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight">
          Report Details
        </h1>
        <div className="w-12" />
      </header>

      <main className="flex-1 px-4 py-4">
        <Card>
          <CardHeader>
            <CardTitle>Report for {reportDate}</CardTitle>
          </CardHeader>
          <CardContent>
            {reportDetailsData.map((item) => (
              <DetailItem key={item.metric} item={item} />
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
