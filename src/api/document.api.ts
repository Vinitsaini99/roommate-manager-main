import api from "@/api/api";

export const uploadDocument = async (
  tenantId: string,
  file: File,
  documentType: string = "address_proof"
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tenant_id", tenantId);
  formData.append("document_type", documentType);

  try {
    const response = await api.post("/document-upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || "Upload failed",
    };
  }
};

export const getDocuments = async (tenantId: string) => {
  try {
    const response = await api.get(`/documents/${tenantId}/`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch documents",
    };
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    await api.delete(`/document/${documentId}/`);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to delete document",
    };
  }
};
