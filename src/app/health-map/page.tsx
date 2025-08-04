
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftIcon, PlusIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Field = {
  id: number;
  name: string;
  pos_x: number;
  pos_y: number;
  health_status: 'Good' | 'Fair' | 'Poor';
  soil_moisture: 'Wet' | 'Moist' | 'Dry';
  plant_state: 'Healthy' | 'Stressed' | 'Drying';
};

const defaultFields: Omit<Field, 'id'>[] = [
    { name: 'A', pos_x: 25, pos_y: 30, health_status: 'Good', soil_moisture: 'Moist', plant_state: 'Healthy' },
    { name: 'B', pos_x: 55, pos_y: 45, health_status: 'Fair', soil_moisture: 'Dry', plant_state: 'Stressed' },
    { name: 'C', pos_x: 40, pos_y: 65, health_status: 'Poor', soil_moisture: 'Wet', plant_state: 'Drying' },
];

export default function HealthMap() {
  const router = useRouter();
  const { toast } = useToast();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchFields = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    const { data, error } = await supabase
      .from('fields')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching fields', description: error.message });
    } else {
      if (data.length === 0) {
        setFields(defaultFields.map((f, i) => ({ ...f, id: -(i + 1) })));
      } else {
        setFields(data);
      }
    }
  }, [router, toast]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !newFieldName) {
      toast({ variant: 'destructive', title: 'Missing information' });
      setIsSubmitting(false);
      return;
    }
    
    // For simplicity, add pins at random locations.
    const newField = {
      name: newFieldName,
      user_id: user.id,
      pos_x: Math.round(Math.random() * 80 + 10),
      pos_y: Math.round(Math.random() * 80 + 10),
      health_status: 'Good',
      soil_moisture: 'Moist',
      plant_state: 'Healthy'
    };

    const { error } = await supabase.from('fields').insert([newField]);

    if (error) {
      toast({ variant: 'destructive', title: 'Error adding field', description: error.message });
    } else {
      toast({ title: 'Field added!' });
      setNewFieldName('');
      fetchFields();
      setIsAddDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteField = async () => {
    if (!selectedField || selectedField.id < 0) {
        // It's a placeholder, just remove from state
        setFields(fields.filter(f => f.id !== selectedField?.id));
        toast({ title: 'Field removed' });
        setIsDeleteDialogOpen(false);
        setSelectedField(null);
        return;
    }

    const { error } = await supabase.from('fields').delete().eq('id', selectedField.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error deleting field', description: error.message });
    } else {
      toast({ title: 'Field deleted' });
      fetchFields();
    }
    setIsDeleteDialogOpen(false);
    setSelectedField(null);
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
          Health Map
        </h1>
        <div className="w-12" />
      </header>

      <main className="relative flex-1 px-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          <Image
            src="https://placehold.co/800x600.png"
            alt="Farm map"
            data-ai-hint="farm aerial view"
            layout="fill"
            objectFit="cover"
          />
          {fields.map((field) => (
            <Dialog key={field.id} onOpenChange={(open) => !open && setSelectedField(null)}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedField(field)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transform"
                  style={{ left: `${field.pos_x}%`, top: `${field.pos_y}%` }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    {field.name}
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Field {selectedField?.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-2 text-sm">
                  <p><strong>Health:</strong> {selectedField?.health_status}</p>
                  <p><strong>Soil:</strong> {selectedField?.soil_moisture}</p>
                  <p><strong>Plants:</strong> {selectedField?.plant_state}</p>
                </div>
                <DialogFooter>
                    <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4"/> Delete
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </main>

       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                 <Button
                    size="icon"
                    className="absolute bottom-24 right-6 h-14 w-14 rounded-full shadow-lg"
                 >
                    <PlusIcon className="h-8 w-8" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Field</DialogTitle>
                    <DialogDescription>Enter a name for the new field pin.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddField}>
                    <div className="py-4">
                        <Input
                        id="fieldName"
                        placeholder="e.g., D"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Field'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
       </Dialog>
       
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the pin for Field {selectedField?.name}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedField(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteField}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>


      <footer className="mt-8 h-[98px] bg-background"></footer>
    </div>
  );
}

    