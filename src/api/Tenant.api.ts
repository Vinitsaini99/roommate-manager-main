import api from "./api";
import { Tenant, TenantHistory } from "@/contexts/DataContext";

// GET all tenants
export const getTenantsAPI = async (): Promise<Tenant[]> => {
  const res = await api.get("/tenants/");
  return res.data;
};

// ADD tenant
export const addTenantAPI = async (data: Tenant) => {
  const res = await api.post("/tenants/", data);
  return res.data;
};

// DELETE tenant
export const deleteTenantAPI = async (id: string) => {
  return api.delete(`/tenants/${id}/`);
};
// UPDATE tenant
export const updateTenantAPI = async (id: string, data: Partial<Tenant>) => {
  const res = await api.put(`/tenants/${id}/`, data);
  return res.data;
};  
// MOVE tenant to history
export const moveTenantToHistoryAPI = async (id: string) => {
  const res = await api.post(`/tenant-history/${id}/move/`);
  return res.data;
};

// TENANT HISTORY APIs
export const getTenantHistoryAPI = async (): Promise<TenantHistory[]> => {
  try {
    const res = await api.get("/tenant-history/");
    return res.data;
  } catch (err) {
    console.warn("tenant_history endpoint not available, using local data");
    return [];
  }
};

export const saveTenantHistoryAPI = async (data: TenantHistory) => {
  try {
    console.log("📤 Saving to tenant_history:", data);
    const res = await api.post("/tenant-history/", data);
    console.log("✅ Saved to backend:", res.data);
    return res.data;
  } catch (err: any) {
    console.error("❌ Failed to save tenant_history:", err?.response?.data || err.message);
    return null;
  }
};

// VERIFY document
export const verifyDocumentAPI = async (tenantId: string, docId: string) => {
  const res = await api.put(`/tenants/${tenantId}/documents/${docId}/verify/`);
  return res.data;
};
// VERIFY all documents
export const verifyAllDocumentsAPI = async (tenantId: string) => {
  const res = await api.put(`/tenants/${tenantId}/documents/verify-all/`);
  return res.data;
};
