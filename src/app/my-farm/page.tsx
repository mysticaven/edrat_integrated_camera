
'use client';

import React from 'react';
import { ArrowLeftIcon } from 'lucide-react';
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
import FarmField3D from '@/components/farm-field-3d';

export default function MyFarmPage() {
  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-background font-body text-foreground">
      <div>
        <header className="absolute top-0 z-10 flex w-full items-center justify-between p-4 bg-transparent">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-6 w-6 text-white" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-white">
            My Farm
          </h1>
          <div className="w-12" />
        </header>
        <main className="absolute inset-0 h-full w-full">
          <FarmField3D />
        </main>
      </div>

      <footer className="sticky bottom-0 z-10 mt-8 bg-transparent">
        <div className="flex gap-2 border-t border-border/20 bg-background/80 px-4 pb-3 pt-2 backdrop-blur-sm">
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
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
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
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
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
        <div className="h-5 bg-background/80 backdrop-blur-sm"></div>
      </footer>
    </div>
  );
}
