import { useState, useEffect, useCallback, useRef } from 'react';
import { TimingData, Subject, SUBJECT_LABELS } from '@/types/assessment';

export const useAssessmentTimer = (currentStep: number, allSubjects: Subject[]) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [stepTimes, setStepTimes] = useState<Record<string, number>>({});
  const startTimeRef = useRef<number>(Date.now());
  const stepStartTimeRef = useRef<number>(Date.now());
  const previousStepRef = useRef<number>(currentStep);

  // Get step name for tracking
  const getStepName = useCallback((step: number): string => {
    if (step === 0) return 'Student Info';
    if (step <= allSubjects.length) {
      const subject = allSubjects[step - 1];
      return SUBJECT_LABELS[subject] || subject;
    }
    return 'Study Habits';
  }, [allSubjects]);

  // Timer effect - counts up every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track time spent on each step
  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      const previousStepName = getStepName(previousStepRef.current);
      const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
      
      setStepTimes(prev => ({
        ...prev,
        [previousStepName]: (prev[previousStepName] || 0) + timeSpent
      }));
      
      stepStartTimeRef.current = Date.now();
      previousStepRef.current = currentStep;
    }
  }, [currentStep, getStepName]);

  // Format seconds to MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get final timing data (call this on submit)
  const getTimingData = useCallback((): TimingData => {
    // Add current step's time
    const currentStepName = getStepName(currentStep);
    const currentStepTime = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
    
    const finalStepTimes = {
      ...stepTimes,
      [currentStepName]: (stepTimes[currentStepName] || 0) + currentStepTime
    };

    return {
      totalSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
      stepTimes: finalStepTimes,
      startTime: startTimeRef.current
    };
  }, [currentStep, getStepName, stepTimes]);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    stepTimes,
    getTimingData,
    formatTime
  };
};
