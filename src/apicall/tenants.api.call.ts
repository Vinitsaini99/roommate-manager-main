import api from "@/api/api";
import { Tenant } from "@/contexts/DataContext";

export const getTenantsAPI = async (): Promise<Tenant[]> => {
  const res = await api.get("/tenant/");
  console.log("res", res.data);
  return res.data;
};
