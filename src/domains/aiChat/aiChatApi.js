import { maxios } from "../../api/axiosConfig";

export const inputMsg = (input) => maxios.get("/chat/message", { params: { chat_seq: input.chat_seq, role: input.role, content: input.content } });
export const sideChatTitleList = () => maxios.get("/chat/sideChatTitleList");
export const getDetailChat = (chat_seq) => maxios.get("/chat/detailChat", { params: { chat_seq: chat_seq } });
export const insertQuestion = (dept) => maxios.post("/chat/insertQuestion", dept);