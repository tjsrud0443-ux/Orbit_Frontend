import { maxios } from "../../api/axiosConfig";

export const insertMinutes = () => maxios.post("/minutes");
