
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';

export default function CreateTask() {
  const router = useRouter();
  const { toast } = useToast();
  const [taskName, setTaskName] = useState('');
  const [field, setField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'You must be logged in to create a task.',
      });
      setIsSubmitting(false);
      router.push('/');
      return;
    }

    if (!taskName || !field) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill out both fields.',
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .insert([{ task_name: taskName, field, user_id: user.id, is_done: false }]);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating task',
        description: error.message,
      });
    } else {
      toast({
        title: 'Task created!',
        description: 'The new task has been added to your list.',
      });
      router.push('/dashboard');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col bg-background font-body text-foreground">
      <header className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
        </Button>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight">
          Create Task
        </h1>
        <div className="w-12" />
      </header>
      <main className="flex-1 px-4">
        <form onSubmit={handleCreateTask} className="space-y-4 py-4">
          <div>
            <label htmlFor="taskName" className="mb-2 block text-sm font-medium">
              Task Name
            </label>
            <Input
              id="taskName"
              type="text"
              placeholder="e.g., Irrigation Check"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="h-12"
            />
          </div>
          <div>
            <label htmlFor="field" className="mb-2 block text-sm font-medium">
              Field
            </label>
            <Input
              id="field"
              type="text"
              placeholder="e.g., Field A"
              value={field}
              onChange={(e) => setField(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="pt-4">
            <Button
              type="submit"
              className="h-12 w-full text-base font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
