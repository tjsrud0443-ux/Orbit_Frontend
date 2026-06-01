import { maxios } from "./axiosConfig";

export const getUsersInfo = () => maxios.get("/users/info");