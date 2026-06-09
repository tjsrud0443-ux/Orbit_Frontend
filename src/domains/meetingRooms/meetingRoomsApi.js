import { maxios } from "../../api/axiosConfig";

export const getAllRooms = () => maxios.get("/meetingRooms/getAllRooms");
export const createReservation = (newEvent) => maxios.post("/meetingRooms/createReservation", newEvent);
export const getReservations = (date, room_seq) => maxios.get("/meetingRooms/getReservations", {params: {date: date, room_seq: room_seq}});