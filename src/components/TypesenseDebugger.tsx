"use client";

import React, { useState, useEffect } from "react";
import { searchClient } from "~/lib/typesense";

export function TypesenseDebugger() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testTypesenseConnection = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      console.log("🧪 Testing Typesense connection...");
      
      // Test basic search
      const searchResults = await searchClient.search([{
        indexName: process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME || "profiles",
        params: {
          query: "*",
          hitsPerPage: 10
        }
      }]);

      console.log("📊 Raw search results:", searchResults);

      setTestResults({
        status: "success",
        data: searchResults,
        message: "Connection successful!"
      });

    } catch (error: any) {
      console.error("❌ Typesense connection failed:", error);
      setTestResults({
        status: "error",
        error: error.message || error.toString(),
        message: "Connection failed!"
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Auto-test on component mount
    testTypesenseConnection();
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">🔧 Typesense Debug Panel</h3>
        <button
          onClick={testTypesenseConnection}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Connection"}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Collection:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME || "profiles"}
        </div>
        <div>
          <strong>Host:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_HOST2 || process.env.NEXT_PUBLIC_TYPESENSE_HOST || "Not set"}
        </div>
        <div>
          <strong>Port:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_PORT2 || process.env.NEXT_PUBLIC_TYPESENSE_PORT || "Not set"}
        </div>
        <div>
          <strong>Protocol:</strong> {process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL2 || process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "Not set"}
        </div>
        <div>
          <strong>API Key:</strong> {
            (process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2 || process.env.NEXT_PUBLIC_TYPESENSE_API_KEY) 
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
          
          {testResults.status === 'success' && testResults.data && (
            <div className="mt-2 text-sm">
              <div>Results found: {testResults.data.results?.[0]?.nbHits || 0}</div>
              <div>Processing time: {testResults.data.results?.[0]?.processingTimeMS || 0}ms</div>
              {testResults.data.results?.[0]?.hits?.length > 0 && (
                <div>First result: {JSON.stringify(testResults.data.results[0].hits[0], null, 2).substring(0, 200)}...</div>
              )}
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
  );
}