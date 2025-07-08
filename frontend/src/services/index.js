// API Configuration
export { default as api } from './api';

// Service Exports
export { authService } from './authService';
export { patientService } from './patientService';
export { scanService } from './scanService';

// Convenience exports for common functions
export const { login, register, logout, getUserInfo, isAuthenticated } = authService;
export const { getAllPatients, getPatient, createPatient, updatePatient, deletePatient } = patientService;
export const { getAllScans, getPatientScans, uploadImage } = scanService; 