'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageCircle, Send, Bot, User, Loader } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatWithFarmAssistant } from '@/ai/flows/farm-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatbotProps = {
    tasks: any[];
    analyticsData: any[];
}

export default function Chatbot({ tasks, analyticsData }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithFarmAssistant({
        question: input,
        tasks: tasks,
        analyticsData: analyticsData,
      });
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error with farm assistant:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get a response from the assistant.',
      });
      // remove the user message if the call fails
       setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: "Hello! How can I help you with your farm today? Feel free to ask about your tasks or analytics." }
      ]);
    }
  }, [isOpen, messages.length]);


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-20"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] h-[70vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Farm Assistant</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6">
            <div className="space-y-4" ref={scrollAreaRef}>
                {messages.map((message, index) => (
                <div
                    key={index}
                    className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                >
                    {message.role === 'assistant' && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                        <Bot className="h-5 w-5" />
                    </div>
                    )}
                    <div
                    className={cn(
                        'max-w-[80%] rounded-lg p-3 text-sm',
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                    >
                    {message.content}
                    </div>
                     {message.role === 'user' && (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                        <User className="h-5 w-5" />
                    </div>
                    )}
                </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                            <Loader className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your farm..."
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
