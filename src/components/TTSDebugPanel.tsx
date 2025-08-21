"use client";

import React, { useState } from "react";
import { X, Bug, PlayCircle, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface TTSDebugStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "error";
  startTime?: number;
  endTime?: number;
  duration?: number;
  details?: string[];
  error?: string;
}

interface TTSDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TTSDebugStep[];
  onClear: () => void;
}

export const TTSDebugPanel: React.FC<TTSDebugPanelProps> = ({
  isOpen,
  onClose,
  steps,
  onClear,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: TTSDebugStep["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />;
      case "in_progress":
        return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: TTSDebugStep["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-300 bg-gray-50";
      case "in_progress":
        return "border-blue-300 bg-blue-50";
      case "completed":
        return "border-green-300 bg-green-50";
      case "error":
        return "border-red-300 bg-red-50";
    }
  };

  const totalDuration = steps.reduce((total, step) => total + (step.duration ?? 0), 0);
  const completedSteps = steps.filter(step => step.status === "completed").length;
  const errorSteps = steps.filter(step => step.status === "error").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">TTS Debug Panel</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-gray-600">Steps</div>
                <div className="text-lg font-semibold">
                  {completedSteps}/{steps.length}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-gray-600">Total Time</div>
                <div className="text-lg font-semibold">
                  {totalDuration > 0 ? `${totalDuration.toFixed(0)}ms` : "−"}
                </div>
              </div>
            </div>
            {errorSteps > 0 && (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="text-red-700 text-sm font-medium">
                  {errorSteps} error{errorSteps > 1 ? "s" : ""} detected
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={onClear}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Clear Debug Log
            </button>
          </div>

          {/* Steps List */}
          <div className="flex-1 overflow-y-auto">
            {steps.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bug className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No TTS debug steps yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start TTS synthesis to see debug information
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-2 rounded-lg transition-all ${getStatusColor(step.status)}`}
                  >
                    <button
                      onClick={() => toggleStepExpansion(step.id)}
                      className="w-full p-3 text-left hover:bg-opacity-80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(step.status)}
                          <div>
                            <div className="font-medium text-gray-900">
                              {step.name}
                            </div>
                            {step.duration && (
                              <div className="text-xs text-gray-600">
                                {step.duration.toFixed(2)}ms
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {expandedSteps.has(step.id) ? "−" : "+"}
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedSteps.has(step.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 border-t border-gray-200 bg-white bg-opacity-50">
                            {step.error && (
                              <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                                <strong>Error:</strong> {step.error}
                              </div>
                            )}
                            {step.details && step.details.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-gray-700">Details:</div>
                                {step.details.map((detail, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
                                    {detail}
                                  </div>
                                ))}
                              </div>
                            )}
                            {step.startTime && (
                              <div className="mt-2 text-xs text-gray-500">
                                Started: {new Date(step.startTime).toLocaleTimeString()}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook to manage TTS debug steps
export const useTTSDebug = () => {
  const [steps, setSteps] = useState<TTSDebugStep[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCapturing = () => {
    setIsCapturing(true);
    setSteps([]);
  };

  const stopCapturing = () => {
    setIsCapturing(false);
  };

  const addStep = (step: Omit<TTSDebugStep, "id">): string => {
    const newStep: TTSDebugStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: step.startTime ?? Date.now(),
    };
    
    if (isCapturing) {
      setSteps(prev => [...prev, newStep]);
    }
    
    return newStep.id;
  };

  const updateStep = (id: string, updates: Partial<TTSDebugStep>) => {
    if (!isCapturing) return;
    
    setSteps(prev => prev.map(step => 
      step.id === id 
        ? { 
            ...step, 
            ...updates, 
            endTime: updates.status === "completed" || updates.status === "error" 
              ? Date.now() 
              : step.endTime,
            duration: updates.status === "completed" || updates.status === "error"
              ? (step.startTime ? Date.now() - step.startTime : undefined)
              : step.duration
          }
        : step
    ));
  };

  const clearSteps = () => {
    setSteps([]);
  };

  return {
    steps,
    isCapturing,
    startCapturing,
    stopCapturing,
    addStep,
    updateStep,
    clearSteps,
  };
};