
'use client';

import {
  ArrowLeft,
  ChevronDown,
  Droplets,
  Sprout,
  Sun,
  Thermometer,
  Trees,
  Bot,
  LineChart as LineChartIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  analyzeFarmData,
  type AnalyzeFarmDataOutput,
} from '@/ai/flows/analyze-farm-data-flow';
import {
  predictFarmYield,
  type PredictFarmYieldOutput,
} from '@/ai/flows/predict-farm-yield-flow';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

type AnalyticsData = {
  id: number;
  field_name: string;
  crop_type: string;
  season: string;
  soil_temp: number;
  soil_moisture: number;
  growth_stage: string;
  sunlight: number;
  canopy_cover: number;
  recorded_at: string;
};

type Metric = 'soil_temp' | 'soil_moisture' | 'sunlight' | 'canopy_cover';

const metricDetails: Record<
  Metric,
  { label: string; icon: React.ElementType; unit: string }
> = {
  soil_temp: { label: 'Soil Temp', icon: Thermometer, unit: '°C' },
  soil_moisture: { label: 'Soil Moisture', icon: Droplets, unit: '%' },
  sunlight: { label: 'Sunlight', icon: Sun, unit: 'hr' },
  canopy_cover: { label: 'Canopy Cover', icon: Trees, unit: '%' },
};

const defaultAnalyticsData: Omit<AnalyticsData, 'id'>[] = [
    { field_name: 'Field A', crop_type: 'Corn', season: '2024 Spring', soil_temp: 22.5, soil_moisture: 60, growth_stage: 'Vegetative', sunlight: 8.2, canopy_cover: 30, recorded_at: '2024-05-01' },
    { field_name: 'Field A', crop_type: 'Corn', season: '2024 Spring', soil_temp: 23.1, soil_moisture: 62, growth_stage: 'Vegetative', sunlight: 8.5, canopy_cover: 35, recorded_at: '2024-05-02' },
    { field_name: 'Field A', crop_type: 'Corn', season: '2024 Spring', soil_temp: 21.8, soil_moisture: 58, growth_stage: 'Tasseling', sunlight: 7.9, canopy_cover: 40, recorded_at: '2024-05-03' },
    { field_name: 'Field A', crop_type: 'Corn', season: '2024 Spring', soil_temp: 22.2, soil_moisture: 61, growth_stage: 'Tasseling', sunlight: 8.1, canopy_cover: 42, recorded_at: '2024-05-04' },
    { field_name: 'Field A', crop_type: 'Corn', season: '2024 Spring', soil_temp: 23.5, soil_moisture: 63, growth_stage: 'Silking', sunlight: 8.8, canopy_cover: 48, recorded_at: '2024-05-05' },
    { field_name: 'Field B', crop_type: 'Soybean', season: '2024 Spring', soil_temp: 24.0, soil_moisture: 65, growth_stage: 'Flowering', sunlight: 9.0, canopy_cover: 50, recorded_at: '2024-05-01' },
    { field_name: 'Field B', crop_type: 'Soybean', season: '2024 Spring', soil_temp: 24.5, soil_moisture: 68, growth_stage: 'Flowering', sunlight: 9.2, canopy_cover: 55, recorded_at: '2024-05-02' },
    { field_name: 'Field B', crop_type: 'Soybean', season: '2024 Spring', soil_temp: 23.5, soil_moisture: 63, growth_stage: 'Pod-setting', sunlight: 8.8, canopy_cover: 60, recorded_at: '2024-05-03' },
    { field_name: 'Field B', crop_type: 'Soybean', season: '2024 Spring', soil_temp: 24.8, soil_moisture: 66, growth_stage: 'Pod-setting', sunlight: 9.1, canopy_cover: 62, recorded_at: '2024-05-04' },
    { field_name: 'Field B', crop_type: 'Soybean', season: '2024 Spring', soil_temp: 25.0, soil_moisture: 70, growth_stage: 'Maturing', sunlight: 9.5, canopy_cover: 68, recorded_at: '2024-05-05' },
];


export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('2024 Spring');
  const [activeMetric, setActiveMetric] = useState<Metric>('soil_temp');
  
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<AnalyzeFarmDataOutput | null>(null);
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);

  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [predictionResults, setPredictionResults] = useState<PredictFarmYieldOutput | null>(null);
  const [isPredictionDialogOpen, setIsPredictionDialogOpen] = useState(false);

  const { toast } = useToast();

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching analytics',
        description: error.message,
      });
      setAnalyticsData([]);
    } else if (data.length === 0) {
      // No real data, use placeholder data
      toast({
        title: 'Displaying Sample Data',
        description: 'No personal analytics found.',
      });
      const placeholderData = defaultAnalyticsData.map((d, i) => ({ ...d, id: -(i + 1) }));
      setAnalyticsData(placeholderData);
    } else {
      setAnalyticsData(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const filteredData = useMemo(() => {
     return analyticsData.filter(d => 
        (selectedField === 'All' || d.field_name === selectedField) &&
        (selectedCrop === 'All' || d.crop_type === selectedCrop) &&
        (selectedSeason === 'All' || d.season === selectedSeason)
      );
  }, [analyticsData, selectedField, selectedCrop, selectedSeason]);


  const { fields, crops, seasons, latestData } = useMemo(() => {
    const fields = ['All', ...new Set(analyticsData.map((d) => d.field_name))];
    const crops = ['All', ...new Set(analyticsData.map((d) => d.crop_type))];
    const seasons = ['All', ...new Set(analyticsData.map((d) => d.season))];
    const latestData = filteredData[filteredData.length - 1] ?? null;
    return { fields, crops, seasons, latestData };
  }, [analyticsData, filteredData]);

  const chartData = useMemo(() => {
    return filteredData.map((d) => ({
      date: format(new Date(d.recorded_at), 'MMM d'),
      value: d[activeMetric],
    }));
  }, [filteredData, activeMetric]);

  const handleGetAiInsights = async () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No data to analyze',
        description: 'Please select filters that contain data.',
      });
      return;
    }
    setIsAiInsightsLoading(true);
    setIsInsightsDialogOpen(true);
    try {
      const insights = await analyzeFarmData({ analyticsData: filteredData });
      setAiInsights(insights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast({
        variant: 'destructive',
        title: 'Error getting AI insights',
        description: (error as Error).message,
      });
       setIsInsightsDialogOpen(false);
    } finally {
      setIsAiInsightsLoading(false);
    }
  };
  
  const handleGetPredictions = async () => {
    if (!filteredData || filteredData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No data for prediction',
        description: 'Please select filters that contain data.',
      });
      return;
    }
    setIsPredictionLoading(true);
    setIsPredictionDialogOpen(true);
    try {
      const result = await predictFarmYield({ analyticsData: filteredData });
      setPredictionResults(result);
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
      toast({
        variant: 'destructive',
        title: 'Error getting AI predictions',
        description: (error as Error).message,
      });
       setIsPredictionDialogOpen(false);
    } finally {
      setIsPredictionLoading(false);
    }
  };


  const MetricCard = ({ metric }: { metric: Metric }) => {
    const { label, icon: Icon, unit } = metricDetails[metric];
    const value = latestData ? latestData[metric] : null;
    const isActive = activeMetric === metric;

    return (
      <button
        onClick={() => setActiveMetric(metric)}
        className={cn(
          'flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 transition-all min-w-[150px]',
          isActive && 'ring-2 ring-primary bg-secondary'
        )}
      >
        <Icon className="h-6 w-6 text-foreground" />
        <div className="text-left">
          <h2 className="text-base font-bold leading-tight text-foreground">
            {label}
          </h2>
          {loading ? (
            <Skeleton className="h-5 w-12 mt-1" />
          ) : (
            <p className="text-sm font-normal text-muted-foreground">
              {value !== null ? `${value} ${unit}` : 'N/A'}
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="relative mx-auto flex size-full min-h-screen max-w-sm flex-col justify-between bg-background font-body text-foreground">
      <div>
        <header className="flex items-center justify-between p-4 pb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <h1 className="flex-1 text-center text-lg font-bold tracking-tight">
            Analytics
          </h1>
          <div className="w-12" />
        </header>

        <main className="flex-1">
          <div className="px-4 pb-3 pt-5 flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">
              Farm Analytics
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetPredictions}
                disabled={isPredictionLoading}
              >
                <LineChartIcon className="mr-2 h-4 w-4" />
                 {isPredictionLoading ? 'Predicting...' : 'Get Predictions'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetAiInsights}
                disabled={isAiInsightsLoading}
              >
                <Bot className="mr-2 h-4 w-4" />
                {isAiInsightsLoading ? 'Analyzing...' : 'Get Insights'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 px-4 pb-3">
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="rounded-xl pl-4 pr-2 w-auto gap-1">
                <SelectValue placeholder="Select Field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="rounded-xl pl-4 pr-2 w-auto gap-1">
                <SelectValue placeholder="Select Crop" />
              </SelectTrigger>
              <SelectContent>
                {crops.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="rounded-xl pl-4 pr-2 w-auto gap-1">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            <MetricCard metric="soil_temp" />
            <MetricCard metric="soil_moisture" />
            <div className="flex flex-1 items-center gap-3 rounded-lg border bg-card p-4 min-w-[150px]">
              <Sprout className="h-6 w-6 text-foreground" />
              <div className="text-left">
                <h2 className="text-base font-bold leading-tight text-foreground">
                  Growth Stage
                </h2>
                {loading ? (
                  <Skeleton className="h-5 w-20 mt-1" />
                ) : (
                   <p className="text-sm font-normal text-muted-foreground">
                    {latestData?.growth_stage || 'N/A'}
                  </p>
                )}
              </div>
            </div>
            <MetricCard metric="sunlight" />
            <MetricCard metric="canopy_cover" />
          </div>

          <div className="h-64 w-full px-4 pt-4">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}${metricDetails[activeMetric].unit}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={metricDetails[activeMetric].label}
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <p>No data for selected filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>

       <AlertDialog open={isInsightsDialogOpen} onOpenChange={setIsInsightsDialogOpen}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>AI-Powered Insights</AlertDialogTitle>
            <AlertDialogDescription>
              Here's an analysis of your farm's data from our AI agronomist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isAiInsightsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : aiInsights ? (
            <div className="text-sm">
              <h3 className="font-bold mb-2">Summary</h3>
              <p className="mb-4 text-muted-foreground">{aiInsights.summary}</p>
              {aiInsights.insights.map((insight, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-semibold text-destructive">Problem: {insight.problem}</h4>
                  <p className="text-primary">Recommendation: <span className="text-muted-foreground">{insight.recommendation}</span></p>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>No insights generated.</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAiInsights(null)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPredictionDialogOpen} onOpenChange={setIsPredictionDialogOpen}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>AI-Powered Predictions</AlertDialogTitle>
            <AlertDialogDescription>
              Here's a yield prediction based on your farm's data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isPredictionLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : predictionResults ? (
            <div className="text-sm space-y-4">
                <div>
                    <h4 className="font-semibold text-primary">Predicted Yield: <span className="text-foreground font-bold">{predictionResults.predicted_yield}</span></h4>
                    <p className="text-xs text-muted-foreground">Confidence: {predictionResults.yield_confidence}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-primary">Next Month Growth</h4>
                    <p className="text-muted-foreground">{predictionResults.next_month_growth_prediction}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-primary">Summary</h4>
                    <p className="text-muted-foreground">{predictionResults.prediction_summary}</p>
                </div>
            </div>
          ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>No predictions generated.</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPredictionResults(null)}>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
            className="flex flex-1 flex-col items-center justify-end gap-1 text-primary"
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
