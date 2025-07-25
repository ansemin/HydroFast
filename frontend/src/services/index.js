// API Configuration
export { default as api } from './api';

// Service Exports
export { authService } from './authService';
export { patientService } from './patientService';
export { scanService } from './scanService';
export { aiProcessingService } from './aiProcessingService';

// Import services first to ensure they're available
import { authService } from './authService';
import { patientService } from './patientService';
import { scanService } from './scanService';
import { aiProcessingService } from './aiProcessingService';

// Convenience exports for common functions
export const { login, register, logout, getUserInfo, isAuthenticated } = authService;
export const { getAllPatients, getPatient, createPatient, updatePatient, deletePatient } = patientService;
export const { getAllScans, getPatientScans, createScan, processWoundDetection, processDepthAnalysis } = scanService;
export const { 
  processWoundDetection: aiProcessWoundDetection,
  processDepthAnalysis: aiProcessDepthAnalysis,
  processMeshGeneration,
  processComprehensiveScan
} = aiProcessingService; 