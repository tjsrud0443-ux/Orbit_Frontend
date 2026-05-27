import { create } from 'zustand';
import { getAllEmployees } from '../domains/approval/approvalApi';

const useEmployeeStore = create((set) => ({
  allEmployees: [],
  isLoading: false,
  error: null,

  fetchEmployees: async () => {
    set({ isLoading: true });
    try {
      const response = await getAllEmployees();
      set({ allEmployees: response.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      set({ error: error.message, isLoading: false });
    }
  },
}));

export default useEmployeeStore;
