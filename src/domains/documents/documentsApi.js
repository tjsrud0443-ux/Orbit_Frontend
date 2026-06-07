import { maxios } from "../../api/axiosConfig";

export const getAllDocs = () => maxios.get("/documents/getAllDocs");
export const getFavorites = () => maxios.get("/documents/getFavorites");
export const addFavorite = (document_seq) => maxios.post(`/documents/addFavorite/${document_seq}`);
export const removeFavorite = (document_seq) => maxios.delete(`/documents/removeFavorite/${document_seq}`);