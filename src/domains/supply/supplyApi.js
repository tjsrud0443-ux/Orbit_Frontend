import { maxios } from "../../api/axiosConfig";

/*비품 관리 */
//비품 전체 리스트
export const getAdminSupplies = () => maxios.get("/admin/supply");
//비품 신청 관리 신청 리스트
export const getSuppyReqList = (params) => maxios.get("/admin/supplyReq",{ params });
export const updateSupplyReqStatus = (upData) => maxios.put("/admin/supplyReqStatus",upData);
//비품 대여 관련

/*비품 신청 관련 */
export const supplyRequest = (supplyreq) => maxios.post("/supply/request",supplyreq);
//비품 목록 출력
export const getSupplies = () => maxios.get("/supply");

