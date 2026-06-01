import { maxios } from "../../api/axiosConfig";

export const inputMsg = (input) => maxios.get("/chat/message", {params: {role : input.role, content : input.content}});
