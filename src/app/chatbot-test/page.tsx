'use client';

import Chatbot from '@/components/chatbot';

export default function ChatbotTestPage() {
  // Mock data for testing
  const mockTasks = [
    { id: 1, title: 'Water plants', completed: false },
    { id: 2, title: 'Check soil pH', completed: true },
  ];

  const mockAnalytics = [
    { date: '2024-01-01', yield: 100 },
    { date: '2024-01-02', yield: 120 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Chatbot Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click the chat icon () in the bottom right corner</li>
            <li>Click the "Scan" button to test camera functionality</li>
            <li>Try both camera capture and image upload</li>
            <li>Test the plant disease analysis API integration</li>
            <li>Check if results display correctly in the chat</li>
          </ol>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Features to Test:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li> Camera access and photo capture</li>
            <li> Image upload from device</li>
            <li> API integration with plant disease prediction</li>
            <li> Local image storage</li>
            <li> Results display in chat interface</li>
            <li> Error handling and user feedback</li>
          </ul>
        </div>
      </div>

      {/* Chatbot Component */}
      <Chatbot tasks={mockTasks} analyticsData={mockAnalytics} />
    </div>
  );
}
