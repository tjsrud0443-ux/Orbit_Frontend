import { maxios } from "../../api/axiosConfig";


export const getGroup = () => maxios.get("/departments/group");
