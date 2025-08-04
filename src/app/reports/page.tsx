
'use client';

import { ArrowLeft, File, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  HouseIcon,
  MapTrifoldIcon,
  CameraIcon,
  PresentationChartIcon,
  UserIcon,
  ReportsIcon,
} from '@/components/icons';

type Report = {
  id: number;
  title: string;
  subtitle: string;
};

const reportsData: Report[] = [
  { id: 1, title: '02/07/2024 Morning', subtitle: 'Daily Farm Summary' },
  { id: 2, title: '01/07/2024 Evening', subtitle: 'Daily Farm Summary' },
  { id: 3, title: '01/07/2024 Morning', subtitle: 'Daily Farm Summary' },
  { id: 4, title: '30/06/2024 Evening', subtitle: 'Daily Farm Summary' },
  { id: 5, title: '30/06/2024 Morning', subtitle: 'Daily Farm Summary' },
];


export default function ReportsPage() {
  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-background font-body text-foreground">
      <div className="flex-1">
        <header className="flex items-center justify-between p-4 pb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold tracking-tight">
            Reports
          </h1>
          <div className="w-12" />
        </header>

        <main className="relative flex-1 space-y-2 py-4">
            {reportsData.map((report) => (
              <div key={report.id} className="flex items-center justify-between gap-4 bg-card px-4 py-2 min-h-[72px]">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                        <File className="h-6 w-6" />
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                        <p className="line-clamp-1 text-base font-medium leading-normal text-foreground">
                            {report.title}
                        </p>
                        <p className="line-clamp-2 text-sm font-normal leading-normal text-muted-foreground">
                            {report.subtitle}
                        </p>
                    </div>
                  </div>
                   <div className="shrink-0">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/reports/${report.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                  </div>
              </div>
            ))}
             <Button size="icon" className="absolute bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
                <Plus className="h-8 w-8" />
            </Button>
        </main>
      </div>


      <footer className="sticky bottom-0 mt-8 bg-background">
        <div className="flex gap-2 border-t border-border px-4 pb-3 pt-2">
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <HouseIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Dashboard</p>
          </Link>
          <Link
            href="/my-farm"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <MapTrifoldIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">My Farm</p>
          </Link>
          <Link
            href="#"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <CameraIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Scan</p>
          </Link>
          <Link
            href="/analytics"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <PresentationChartIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Analytics</p>
          </Link>
          <Link
            href="/reports"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
          >
            <div className="flex h-8 items-center justify-center">
              <ReportsIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Reports</p>
          </Link>
          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Profile</p>
          </Link>
        </div>
        <div className="h-5 bg-background"></div>
      </footer>
    </div>
  );
}
