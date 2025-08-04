
'use client';

import {
  ArrowLeftIcon,
  Bell,
  FileText,
  Globe,
  HelpCircle,
  MapPin,
  Moon,
  Phone,
  Ruler,
  Shield,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  CameraIcon,
  HouseIcon,
  MapTrifoldIcon,
  PresentationChartIcon,
  ReportsIcon,
  UserIcon,
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const { toast, dismiss } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'blue') {
      document.documentElement.classList.add('dark');
      if (savedTheme === 'blue') {
        document.documentElement.classList.add('blue');
      }
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark', 'blue');
      setIsDarkMode(false);
    }
  }, []);

  const handleNotificationsChange = (checked: boolean) => {
    setIsNotificationsEnabled(checked);
    if (!checked) {
      dismiss(); // Dismiss any active toast
    }
    toast({
      title: 'Notifications',
      description: `In-app notifications have been ${
        checked ? 'enabled' : 'disabled'
      }.`,
    });
  };

  const handleThemeChange = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.add('blue');
      localStorage.setItem('theme', 'blue');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('blue');
      localStorage.setItem('theme', 'light');
    }
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return name.substring(0, 2);
  };

  const ListItem = ({
    icon,
    title,
    subtitle,
    children,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      className="flex min-h-14 items-center gap-4 bg-card px-4 py-2"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <p className="line-clamp-1 text-base font-normal leading-normal text-foreground">
          {title}
        </p>
        {subtitle && (
          <p className="line-clamp-2 text-sm font-normal leading-normal text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-background font-body text-foreground">
      <div>
        <header className="flex items-center justify-between p-4 pb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold tracking-tight">
            Account
          </h1>
          <div className="w-12" />
        </header>

        <main className="flex-1">
          <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold tracking-tight text-foreground">
            Personal Information
          </h2>
          <div className="flex items-center gap-4 bg-card px-4 py-2 min-h-[72px]">
            {user?.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || 'User Avatar'}
                width={56}
                height={56}
                className="rounded-full"
              />
            ) : (
              <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
                {user?.user_metadata?.full_name
                  ? getInitials(user.user_metadata.full_name)
                  : 'U'}
              </div>
            )}
            <div className="flex flex-col justify-center">
              <p className="line-clamp-1 text-base font-medium leading-normal text-foreground">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="line-clamp-2 text-sm font-normal leading-normal text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <ListItem
            icon={<Phone className="h-6 w-6" />}
            title="Phone Number"
            subtitle="+1 (555) 123-4567"
          />

          <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold tracking-tight text-foreground">
            Farm Details
          </h2>
          <ListItem
            icon={<MapPin className="h-6 w-6" />}
            title="Farm Address"
            subtitle="1234 Green Acres Rd, Anytown, USA"
          />
          <ListItem
            icon={<Ruler className="h-6 w-6" />}
            title="Farm Size"
            subtitle="100 acres"
          />

          <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold tracking-tight text-foreground">
            App Settings
          </h2>
          <ListItem icon={<Bell className="h-6 w-6" />} title="Notifications">
            <Switch
              checked={isNotificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
          </ListItem>

          <Dialog
            open={isLanguageDialogOpen}
            onOpenChange={setIsLanguageDialogOpen}
          >
            <DialogTrigger asChild>
              <ListItem
                icon={<Globe className="h-6 w-6" />}
                title="Language"
                onClick={() => setIsLanguageDialogOpen(true)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {language === 'en' ? 'English' : 'Hindi'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </ListItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select Language</DialogTitle>
              </DialogHeader>
              <RadioGroup
                value={language}
                onValueChange={(value) => {
                  setLanguage(value);
                  setIsLanguageDialogOpen(false);
                }}
                className="py-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="en" />
                  <Label htmlFor="en" className="flex-1">
                    English
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hi" id="hi" />
                  <Label htmlFor="hi" className="flex-1">
                    Hindi
                  </Label>
                </div>
              </RadioGroup>
            </DialogContent>
          </Dialog>

          <ListItem icon={<Moon className="h-6 w-6" />} title="Theme">
            <Switch checked={isDarkMode} onCheckedChange={handleThemeChange} />
          </ListItem>

          <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold tracking-tight text-foreground">
            Help & Support
          </h2>
          <ListItem
            icon={<HelpCircle className="h-6 w-6" />}
            title="Contact Support"
            onClick={() => {
              window.location.href = 'mailto:ebatpayments@gmail.com';
            }}
          />
          <ListItem
            icon={<FileText className="h-6 w-6" />}
            title="Terms of Service"
            onClick={() => {}}
          />
          <ListItem
            icon={<Shield className="h-6 w-6" />}
            title="Privacy Policy"
            onClick={() => {}}
          />
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
            className="flex flex-1 flex-col items-center justify-end gap-1 text-muted-foreground"
          >
            <div className="flex h-8 items-center justify-center">
              <ReportsIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-medium">Reports</p>
          </Link>
          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
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
