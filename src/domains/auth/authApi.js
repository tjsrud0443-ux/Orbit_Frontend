import { maxios } from "../../api/axiosConfig";

export const loginRequest = (login) => maxios.post("/auth/login", login);
export const duplCheck = (id) => maxios.get("/signup/duplCheck", {params: {id:id}});
export const signupRequest = (data) => maxios.post("/signup", data);