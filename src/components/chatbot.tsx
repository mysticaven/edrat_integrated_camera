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
import { MessageCircle, Send, Bot, User, Loader, Camera, Upload, X, RotateCcw, Leaf, Thermometer, CheckCircle, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatWithFarmAssistant } from '@/ai/flows/farm-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  scanResult?: {
    plantDisease?: any;
    thermalDisease?: any;
    analysisType: 'plant' | 'thermal' | 'both';
  };
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
  const [showScan, setShowScan] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsScanning(true);
    setScanProgress('Preparing image...');
    
    try {
      // Convert data URL to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create FormData for the API
      const formData = new FormData();
      formData.append('file', blob, 'plant-image.jpg');
      
      const results: any = {};
      let analysisType: 'plant' | 'thermal' | 'both' = 'plant';
      
      // Try both APIs in parallel for comprehensive analysis
      setScanProgress('Analyzing plant disease...');
      
      const [plantResponse, thermalResponse] = await Promise.allSettled([
        fetch('https://gowshik2004-plant-thermal-disease-predictor.hf.space/predict_plant_disease', {
          method: 'POST',
          body: formData,
        }),
        fetch('https://gowshik2004-plant-thermal-disease-predictor.hf.space/predict_thermal_disease', {
          method: 'POST',
          body: formData,
        })
      ]);

      // Process plant disease results
      if (plantResponse.status === 'fulfilled' && plantResponse.value.ok) {
        try {
          results.plantDisease = await plantResponse.value.json();
          analysisType = 'both';
        } catch (e) {
          console.warn('Failed to parse plant disease response');
        }
      }

      // Process thermal disease results
      if (thermalResponse.status === 'fulfilled' && thermalResponse.value.ok) {
        try {
          results.thermalDisease = await thermalResponse.value.json();
          if (analysisType === 'plant') analysisType = 'thermal';
        } catch (e) {
          console.warn('Failed to parse thermal disease response');
        }
      }

      // If both failed, try sequential approach
      if (!results.plantDisease && !results.thermalDisease) {
        setScanProgress('Retrying analysis...');
        
        // Try plant disease first
        try {
          const plantRetry = await fetch('https://gowshik2004-plant-thermal-disease-predictor.hf.space/predict_plant_disease', {
            method: 'POST',
            body: formData,
          });
          if (plantRetry.ok) {
            results.plantDisease = await plantRetry.json();
            analysisType = 'plant';
          }
        } catch (e) {
          // Try thermal disease as fallback
          try {
            const thermalRetry = await fetch('https://gowshik2004-plant-thermal-disease-predictor.hf.space/predict_thermal_disease', {
              method: 'POST',
              body: formData,
            });
            if (thermalRetry.ok) {
              results.thermalDisease = await thermalRetry.json();
              analysisType = 'thermal';
            }
          } catch (thermalError) {
            throw new Error('Both APIs failed');
          }
        }
      }

      if (!results.plantDisease && !results.thermalDisease) {
        throw new Error('No analysis results received');
      }

      // Store image locally
      const imageId = `scan_${Date.now()}`;
      localStorage.setItem(`scan_image_${imageId}`, imageData);
      
      // Add scan result to messages
      const scanMessage: Message = {
        role: 'assistant',
        content: ` **Plant Analysis Complete!**\n\nI've analyzed your plant image using our AI-powered disease detection system. Here are the comprehensive results:`,
        image: imageData,
        scanResult: {
          ...results,
          analysisType
        }
      };
      
      setMessages((prev) => [...prev, scanMessage]);
      
      // Reset scan state
      setCapturedImage(null);
      setShowScan(false);
      setScanProgress('');
      
      toast({
        title: 'Analysis Complete!',
        description: `Successfully analyzed using ${analysisType === 'both' ? 'both plant and thermal' : analysisType} disease detection.`,
      });
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: 'Could not analyze the image. Please try again.',
      });
      setScanProgress('');
    } finally {
      setIsScanning(false);
    }
  };

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
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { role: 'assistant', content: " **Welcome to Farm Assistant!**\n\nI'm here to help you with your farm management. You can:\n\n Ask questions about your tasks and analytics\n Use the **Scan** feature to analyze plant diseases\n Get AI-powered insights for better crop health\n\nTry scanning a plant image to get started!" }
      ]);
    }
  }, [isOpen, messages.length]);

  const formatResultValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const renderScanResult = (result: any) => {
    if (!result) return null;
    
    const { plantDisease, thermalDisease, analysisType } = result;
    
    return (
      <div className="mt-4 space-y-4">
        {/* Analysis Type Indicator */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Analysis completed using {analysisType === 'both' ? 'both plant and thermal disease detection' : 
                                   analysisType === 'plant' ? 'plant disease detection' : 'thermal disease detection'}
          </span>
        </div>

        {/* Plant Disease Results */}
        {plantDisease && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800"> Plant Disease Analysis</h4>
            </div>
            <div className="space-y-3">
              {typeof plantDisease === 'object' ? (
                Object.entries(plantDisease).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium text-green-700 capitalize min-w-0 flex-shrink-0">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-green-600 font-mono text-sm bg-green-100 px-2 py-1 rounded">
                      {formatResultValue(value)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-green-700 bg-green-100 p-3 rounded font-mono text-sm">
                  {formatResultValue(plantDisease)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Thermal Disease Results */}
        {thermalDisease && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-orange-800"> Thermal Disease Analysis</h4>
            </div>
            <div className="space-y-3">
              {typeof thermalDisease === 'object' ? (
                Object.entries(thermalDisease).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium text-orange-700 capitalize min-w-0 flex-shrink-0">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-orange-600 font-mono text-sm bg-orange-100 px-2 py-1 rounded">
                      {formatResultValue(value)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-orange-700 bg-orange-100 p-3 rounded font-mono text-sm">
                  {formatResultValue(thermalDisease)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-purple-800"> Recommendations</h4>
          </div>
          <p className="text-purple-700 text-sm">
            Based on the analysis results, consider consulting with a plant health specialist for detailed treatment recommendations. 
            Monitor your plants regularly and maintain proper growing conditions.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-20 bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-green-50 to-blue-50">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-green-600" />
            Farm Assistant
          </DialogTitle>
        </DialogHeader>
        
        {showScan ? (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                Plant Disease Scanner
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowScan(false);
                  setCapturedImage(null);
                  stopCamera();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {!capturedImage ? (
              <div className="space-y-6">
                {!stream ? (
                  <div className="text-center space-y-6">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <Camera className="h-16 w-16 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-500 font-medium">Camera Ready</p>
                        <p className="text-gray-400 text-sm">Capture or upload a plant image for analysis</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={startCamera} className="flex-1 h-12 text-base">
                        <Camera className="h-5 w-5 mr-2" />
                        Start Camera
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 h-12 text-base"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-gray-200">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        Live Camera
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={capturePhoto} className="flex-1 h-12 text-base">
                        <Camera className="h-5 w-5 mr-2" />
                        Capture Photo
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 h-12 text-base"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Instead
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured plant"
                    className="w-full aspect-video object-cover rounded-xl border-2 border-gray-200"
                  />
                  <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                    Ready for Analysis
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={retakePhoto} 
                    variant="outline" 
                    className="flex-1 h-12 text-base"
                    disabled={isScanning}
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Retake
                  </Button>
                  <Button 
                    onClick={() => analyzeImage(capturedImage)} 
                    className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <Loader className="h-5 w-5 mr-2 animate-spin" />
                        {scanProgress || 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2" />
                        Analyze Plant
                      </>
                    )}
                  </Button>
                </div>
                {isScanning && scanProgress && (
                  <div className="text-center text-sm text-gray-600">
                    {scanProgress}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
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
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <Bot className="h-5 w-5" />
                        </div>
                        )}
                        <div
                        className={cn(
                            'max-w-[85%] rounded-xl p-4 text-sm shadow-sm',
                            message.role === 'user'
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-200'
                        )}
                        >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        {message.image && (
                          <div className="mt-3">
                            <img
                              src={message.image}
                              alt="Scanned plant"
                              className="w-full max-w-xs rounded-lg border-2 border-gray-200"
                            />
                          </div>
                        )}
                        {message.scanResult && renderScanResult(message.scanResult)}
                        </div>
                         {message.role === 'user' && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <User className="h-5 w-5" />
                        </div>
                        )}
                    </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Bot className="h-5 w-5" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <Loader className="h-5 w-5 animate-spin text-green-600" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-2 bg-gray-50">
              <div className="flex w-full gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowScan(true)}
                  className="flex-shrink-0 h-12 px-4 border-green-200 text-green-700 hover:bg-green-50"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Scan
                </Button>
                <form onSubmit={handleSendMessage} className="flex flex-1 gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your farm..."
                    disabled={isLoading}
                    className="h-12"
                  />
                  <Button type="submit" size="icon" disabled={isLoading} className="h-12 w-12 bg-green-600 hover:bg-green-700">
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </DialogFooter>
          </>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
