import { maxios } from "../../api/axiosConfig";

export const getAllEmp = () => maxios.get("/project/allEmployee");
export const insertProjectAndMembers = (projects) => maxios.post("project/insertProjectAndMembers", projects);