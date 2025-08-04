
'use client';

import { Button } from '@/components/ui/button';
import {
  CameraIcon,
  HouseIcon,
  MapTrifoldIcon,
  PlantIcon,
  PresentationChartIcon,
  UserIcon,
  ReportsIcon,
} from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Trash2, Bell, X, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Chatbot from '@/components/chatbot';

type Task = {
  id: number;
  task_name: string;
  field: string;
  is_done: boolean;
  created_at: string;
};

type Notification = {
  id: number;
  type: string;
  title: string;
  description: string;
  image_url: string;
  status: 'active' | 'snoozed' | 'cleared';
};

type Weather = {
  temp: number | null;
  condition: string | null;
}

const defaultNotifications: Omit<Notification, 'id' | 'status'>[] = [
  {
    type: 'urgent',
    title: 'High Pest Alert in Field B',
    description: 'Take action to prevent crop damage.',
    image_url: 'https://placehold.co/100x75.png',
  },
  {
    type: 'health',
    title: 'Overall Farm Health: 85% (Good)',
    description: 'Keep up the great work!',
    image_url: 'https://placehold.co/100x75.png',
  },
   {
    type: 'info',
    title: 'New Irrigation Schedule Available',
    description: 'Check the updated schedule for Field A.',
    image_url: 'https://placehold.co/100x75.png',
  },
];

const getWeatherConditionFromCode = (code: number): string => {
    if (code === 0) return 'Clear sky';
    if (code >= 1 && code <= 3) return 'Mainly Clear';
    if (code === 45 || code === 48) return 'Fog';
    if (code >= 51 && code <= 55) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code === 80 || code === 81 || code === 82) return 'Rain Showers';
    if (code === 85 || code === 86) return 'Snow Showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Cloudy';
};


export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weather, setWeather] = useState<Weather>({ temp: null, condition: null });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
      const data = await response.json();
      if (response.ok) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          condition: getWeatherConditionFromCode(data.current.weather_code),
        });
      } else {
        throw new Error(data.reason || 'Failed to fetch weather data');
      }
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      toast({ variant: 'destructive', title: 'Could not fetch weather', description: (error as Error).message });
      setWeather({ temp: 24, condition: 'Sunny' }); // Fallback
    }
  }, [toast]);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser(user);

    // Fetch Tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('is_done', { ascending: true })
      .order('created_at', { ascending: false });

    if (tasksError) {
      toast({ variant: 'destructive', title: 'Error fetching tasks', description: tasksError.message });
    } else {
      setTasks(tasksData);
    }

    // Fetch Analytics
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false });

    if (analyticsError) {
      toast({ variant: 'destructive', title: 'Error fetching analytics', description: analyticsError.message });
    } else {
      setAnalyticsData(analyticsData);
    }


    // Fetch Notifications
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'cleared') // Fetch active and snoozed
      .order('created_at', { ascending: false });

    if (notificationsError) {
      toast({ variant: 'destructive', title: 'Error fetching notifications', description: notificationsError.message });
    } else {
       if (notificationsData.length === 0) {
        // No notifications in DB, show default ones
        const placeholderNotifications = defaultNotifications.map((n, i) => ({ ...n, id: -(i + 1), status: 'active' as const }));
        setNotifications(placeholderNotifications);
      } else {
        setNotifications(notificationsData);
      }
    }
  }, [router, toast]);

  useEffect(() => {
    fetchData();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherData(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({ variant: 'destructive', title: 'Location Error', description: 'Could not get your location. Using default weather.' });
          // Fallback to default weather if location is denied
          setWeather({ temp: 24, condition: 'Sunny' });
        }
      );
    } else {
      toast({ variant: 'destructive', title: 'Location Error', description: 'Geolocation is not supported. Using default weather.' });
      setWeather({ temp: 24, condition: 'Sunny' });
    }

  }, [fetchData, fetchWeatherData, toast]);


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getFirstName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'User';
  };

  const handleUpdateTask = async (taskId: number, isDone: boolean) => {
    const { error } = await supabase.from('tasks').update({ is_done: isDone }).eq('id', taskId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error updating task', description: error.message });
    } else {
      fetchData(); // Refresh all data
      toast({ title: `Task marked as ${isDone ? 'done' : 'pending'}` });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting task', description: error.message });
    } else {
      fetchData(); // Refresh all data
      toast({ title: 'Task deleted successfully' });
    }
  };

  const handleUpdateNotification = async (notificationId: number, status: 'snoozed' | 'cleared') => {
    if (notificationId < 0) { // It's a placeholder
       setNotifications(notifications.filter(n => n.id !== notificationId));
       toast({ title: `Notification ${status}` });
       return;
    }
    const { error } = await supabase.from('notifications').update({ status }).eq('id', notificationId);
     if (error) {
      toast({ variant: 'destructive', title: 'Error updating notification', description: error.message });
    } else {
      fetchData(); // Refresh all data
      toast({ title: `Notification ${status}` });
    }
  };


  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-background font-body text-foreground">
      <div>
        <header className="flex items-center justify-between bg-background p-4 pb-2">
          <h2 className="flex-1 text-lg font-bold tracking-tight text-foreground">
            Good Morning, {getFirstName()}!
          </h2>
          <AlertDialog>
             <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 text-foreground">
                    <UserIcon className="h-6 w-6" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        </header>
        <p className="px-4 pb-3 pt-1 text-sm font-normal leading-normal text-muted-foreground flex items-center">
            {weather.condition ? (
                <>
                    <CloudSun className="mr-2 h-4 w-4" />
                    {weather.condition}, {weather.temp !== null ? `${weather.temp}°C` : '...'}
                </>
            ) : (
              'Loading weather...'
            )}
        </p>

        <main className="px-4">
          <ScrollArea className="h-48 w-full">
            <div className="space-y-4 pr-4">
            {notifications.filter(n => n.status === 'active').map((notification) => (
              <AlertDialog key={notification.id} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <AlertDialogTrigger asChild onClick={() => setSelectedNotification(notification)}>
                   <div className="flex cursor-pointer items-stretch justify-between gap-4 rounded-lg bg-card p-4 shadow-[0_0_4px_rgba(0,0,0,0.1)]">
                    <div className="flex flex-[2_2_0px] flex-col gap-1">
                      <p className={cn("text-sm font-normal leading-normal", notification.type === 'urgent' ? 'text-destructive' : 'text-muted-foreground')}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </p>
                      <p className="text-base font-bold leading-tight text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-sm font-normal leading-normal text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    <div className="relative flex-1">
                      <Image
                        src={notification.image_url}
                        alt={notification.title}
                        data-ai-hint="farm notification"
                        width={100}
                        height={75}
                        className="aspect-video w-full rounded-lg bg-cover bg-center bg-no-repeat object-cover"
                      />
                    </div>
                  </div>
                </AlertDialogTrigger>
                 <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{selectedNotification?.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                       What would you like to do with this notification?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="grid grid-cols-1 sm:flex-col sm:space-y-2">
                     <AlertDialogAction
                      onClick={() => handleUpdateNotification(selectedNotification!.id, 'snoozed')}
                      className="flex items-center gap-2"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Snooze</span>
                    </AlertDialogAction>
                    <AlertDialogAction
                      variant="secondary"
                      onClick={() => handleUpdateNotification(selectedNotification!.id, 'cleared')}
                      className="flex items-center gap-2"
                    >
                       <X className="h-4 w-4" />
                      <span>Clear</span>
                    </AlertDialogAction>
                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
            </div>
           </ScrollArea>
        </main>

        <div className="flex flex-wrap justify-between gap-3 px-4 py-3">
          <Button className="min-w-[84px] flex-1 text-sm font-bold">
            Scan for Disease
          </Button>
          <Button
            asChild
            variant="secondary"
            className="min-w-[84px] flex-1 text-sm font-bold"
          >
            <Link href="/health-map">View Health Map</Link>
          </Button>
        </div>
        <div className="px-4 py-3">
          <Button asChild variant="secondary" className="w-full text-sm font-bold">
            <Link href="/create-task">Create Task</Link>
          </Button>
        </div>

        <h2 className="px-4 pb-3 pt-5 text-[22px] font-bold tracking-tight text-foreground">
          Upcoming Tasks
        </h2>
        <div className="space-y-2 px-4">
           {tasks.length > 0 ? (
            tasks.map((task) => (
              <AlertDialog key={task.id} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <AlertDialogTrigger asChild onClick={() => setSelectedTask(task)}>
                  <div className={cn(
                      "flex min-h-[72px] items-center gap-4 rounded-lg bg-card py-2 px-4 cursor-pointer transition-colors hover:bg-accent",
                      task.is_done && "opacity-60"
                    )}>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <PlantIcon className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className={cn("line-clamp-1 text-base font-medium leading-normal text-foreground", task.is_done && "line-through")}>
                        {task.task_name}
                      </p>
                      <p className="line-clamp-2 text-sm font-normal leading-normal text-muted-foreground">
                        {task.field}
                      </p>
                    </div>
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{selectedTask?.task_name}</AlertDialogTitle>
                    <AlertDialogDescription>
                       What would you like to do with this task?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="grid grid-cols-1 sm:flex-col sm:space-y-2">
                     <AlertDialogAction
                      onClick={() => handleUpdateTask(selectedTask!.id, !selectedTask!.is_done)}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{selectedTask?.is_done ? 'Mark as Pending' : 'Mark as Done'}</span>
                    </AlertDialogAction>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => handleDeleteTask(selectedTask!.id)}
                      className="flex items-center gap-2"
                    >
                       <Trash2 className="h-4 w-4" />
                      <span>Delete Task</span>
                    </AlertDialogAction>
                     <AlertDialogCancel>Cancel</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))
          ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>No tasks yet.</p>
                <p>Click "Create Task" to get started.</p>
            </div>
          )}
        </div>
      </div>
      
      <Chatbot tasks={tasks} analyticsData={analyticsData} />

      <footer className="sticky bottom-0 mt-8 bg-background">
        <div className="flex gap-2 border-t border-border px-4 pb-3 pt-2">
          <Link
            href="/dashboard"
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
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
