import { maxios } from "../../api/axiosConfig";

export const getAllEmployees = () => maxios.get("/approval/all");
