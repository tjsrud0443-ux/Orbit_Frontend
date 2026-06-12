import { maxios } from "../../api/axiosConfig";

export const getAllEmp = () => maxios.get("/project/allEmployee");
export const insertProjectAndMembers = (projects) => maxios.post("project/insertProjectAndMembers", projects);
export const getMyAllProject = () => maxios.get("/project/getMyAllProject");
export const updateProject = (updatedEntry) => maxios.put("/project/projectUpdate", updatedEntry);
export const deleteProject = (project_seq) => maxios.delete("/project/projectDelete/"+project_seq)