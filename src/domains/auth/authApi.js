import { maxios } from "../../api/axiosConfig";

export const login = (login) => maxios.post("/auth/login", login);