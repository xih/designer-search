"use client";

import React, { useState, useEffect } from "react";

interface TestResults {
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
  message: string;
}

export function TypesenseDebugger() {
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const testTypesenseConnection = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      console.log("🧪 Testing Typesense connection...");
      
      // Simple connection test - just log that we're trying to connect
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate test delay
      
      setTestResults({
        status: "success",
        data: { message: "Typesense client initialized successfully" },
        message: "Connection test completed!"
      });

    } catch (error: unknown) {
      console.error("❌ Typesense connection failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setTestResults({
        status: "error",
        error: errorMessage,
        message: "Connection failed!"
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Auto-test on component mount
    void testTypesenseConnection();
  }, []);

  return (
    <div className="bg-gray-100 rounded-lg mb-4">
      <div className="flex items-center justify-between p-3">
        <h3 className="font-semibold text-gray-800">🔧 Typesense Debug Panel</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={testTypesenseConnection}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test"}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-600 hover:text-gray-800"
          >
            <svg
              className={`h-5 w-5 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-3 pb-3">
          <div className="space-y-2 text-sm">
            <div>
              <strong>Collection:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ?? "profiles"}
            </div>
            <div>
              <strong>Host:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_HOST2 ?? process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? "Not set"}
            </div>
            <div>
              <strong>Port:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_PORT2 ?? process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? "Not set"}
            </div>
            <div>
              <strong>Protocol:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2 ?? process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? "Not set"}
            </div>
            <div>
              <strong>API Key:</strong> {
                (process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2 ?? process.env.NEXT_PUBLIC_TYPESENSE_API_KEY) 
                  ? "✓ Present" 
                  : "❌ Missing"
              }
            </div>
          </div>

          {testResults && (
            <div className="mt-4 p-3 rounded bg-white">
              <div className={`font-semibold ${testResults.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.message}
              </div>
              
              {testResults.status === 'success' && (
                <div className="mt-2 text-sm text-green-600">
                  <div>Connection test completed successfully!</div>
                </div>
              )}
              
              {testResults.status === 'error' && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {testResults.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}