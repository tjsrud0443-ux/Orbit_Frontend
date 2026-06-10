import { maxios } from "../../api/axiosConfig";

/*비품 관련 */
export const getSupplies = () => maxios.get("/supply");

/*비품 신청 관련 */
export const supplyRequest = (supplyreq) => maxios.post("/supply/request",supplyreq);
/*비품 대여 관련 */