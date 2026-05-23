import { maxios } from "../../api/axiosConfig";

export const loginRequest = (login) => maxios.post("/auth/login", login);