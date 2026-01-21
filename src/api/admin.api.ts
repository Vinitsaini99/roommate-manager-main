import api from "./api";

export const createFacilityApi = (data: {
  facility_name: string;
  sr_no: number;
  remarks: string;
}) => {
  return api.post("/facilities/", data); // 🔥 trailing slash
};
