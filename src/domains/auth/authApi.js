import { maxios } from "../../api/axiosConfig";

export const loginRequest = (login) => maxios.post("/auth/login", login);
export const idDuplCheck = (id) => maxios.get("/signup/idDuplCheck", {params: {id:id}});
export const emailDuplCheck = (email) => maxios.get("/signup/emailDuplCheck", {params: {email:email}});
export const signupRequest = (data) => maxios.post("/signup", data);

export const sendMailForId = (formData) => maxios.post("/auth/requestMailForId", formData);
export const verifyForFindId = (formData) => maxios.post("/auth/findId", formData);
export const sendMailForPw = (formData) => maxios.post("/auth/requestMailForPw", formData);
export const verifyForFindPw = (formData) => maxios.post("/auth/verifyForPw", formData);
export const sendNewPw = (formData) => maxios.post("/auth/changePw", formData);