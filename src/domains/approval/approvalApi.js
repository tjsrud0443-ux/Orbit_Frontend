import { maxios } from "../../api/axiosConfig";

export const approvalApi = {
    getApprovalList: () => maxios.get('/approval'),
    getAllEmployees: () => maxios.get('/users/all') // Assuming this endpoint exists based on the requirement
};
