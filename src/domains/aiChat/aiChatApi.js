import { maxios } from "../../api/axiosConfig";

export const inputMsg = (input) => maxios.get("/chat/message", {params: {chat_seq : input.chat_seq , role : input.role, content : input.content}});
