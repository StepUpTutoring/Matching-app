// src/hooks/useStudents.js

import { useState, useCallback } from 'react';
import { mockStudents } from '../mockData';

export const useStudents = () => {
  const [students, setStudents] = useState(mockStudents);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setIsLoadingStudents(true);
    setStudentError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStudents(mockStudents);
    } catch (error) {
      setStudentError('Failed to fetch students');
      console.error('Error fetching students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  const updateStudent = useCallback(async (studentId, data) => {
    setIsLoadingStudents(true);
    setStudentError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setStudents(prevStudents =>
        prevStudents.map(student =>
          student.id === studentId ? { ...student, ...data } : student
        )
      );
    } catch (error) {
      setStudentError('Failed to update student');
      console.error('Error updating student:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  return { students, isLoadingStudents, studentError, fetchStudents, updateStudent };
};