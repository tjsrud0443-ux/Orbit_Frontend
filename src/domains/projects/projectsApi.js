import { maxios } from "../../api/axiosConfig";

export const getAllEmp = () => maxios.get("/project/allEmployee");
export const insertProjectAndMembers = (projects) => maxios.post("project/insertProjectAndMembers", projects);
export const getMyAllProject = () => maxios.get("/project/getMyAllProject");
export const updateProject = (updatedEntry) => maxios.put("/project/projectUpdate", updatedEntry);
export const deleteProject = (project_seq) => maxios.delete("/project/projectDelete/" + project_seq);
export const completeProject = (project_seq) => maxios.put("/project/projectComplete/" + project_seq);

export const getKanbanTaskList = (projectSeq) => maxios.get("/project/getKanbanTaskList/" + projectSeq);
export const getProjectMembers = (projectSeq) => maxios.get("/project/getProjectMembers/" + projectSeq);
export const insertTask = (params) => maxios.post("/project/insertTask", params);
export const getProject = (projectSeq) => maxios.get("/project/getProject/" + projectSeq);