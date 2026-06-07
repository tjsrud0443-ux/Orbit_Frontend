import { maxios } from "../../api/axiosConfig";

export const getAllRooms = () => maxios.get("/meetingRooms/getAllRooms");