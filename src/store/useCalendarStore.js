// store/useCalendarStore.js
import { create } from 'zustand';

const useCalendarStore = create((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
}));

export default useCalendarStore;