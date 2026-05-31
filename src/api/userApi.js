import { maxios } from "./axiosConfig";

export const getUsersInfo = () => maxios.get("/users/info");
export const updateUserInfo = (userData) => maxios.put("/users/info", userData);