// src/hooks/useTutors.js

import { useState, useCallback } from 'react';
import { mockTutors } from '../mockData';

export const useTutors = () => {
  const [tutors, setTutors] = useState(mockTutors);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [tutorError, setTutorError] = useState(null);

  const fetchTutors = useCallback(async () => {
    setIsLoadingTutors(true);
    setTutorError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTutors(mockTutors);
    } catch (error) {
      setTutorError('Failed to fetch tutors');
      console.error('Error fetching tutors:', error);
    } finally {
      setIsLoadingTutors(false);
    }
  }, []);

  const updateTutor = useCallback(async (tutorId, data) => {
    setIsLoadingTutors(true);
    setTutorError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setTutors(prevTutors =>
        prevTutors.map(tutor =>
          tutor.id === tutorId ? { ...tutor, ...data } : tutor
        )
      );
    } catch (error) {
      setTutorError('Failed to update tutor');
      console.error('Error updating tutor:', error);
    } finally {
      setIsLoadingTutors(false);
    }
  }, []);

  return { tutors, isLoadingTutors, tutorError, fetchTutors, updateTutor };
};