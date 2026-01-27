import React, { useState, useRef } from 'react';
import { FileText, CheckCircle, Clock, Eye, AlertCircle, Upload, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import api from '@/api/api';

export default function TenantDocuments() {
  const { user } = useAuth();
  const { tenants } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const tenant = tenants.find(t => t.email === user?.email);

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-medium text-foreground">Tenant data not found</p>
        <p className="text-sm text-muted-foreground mt-1">Please contact admin for assistance</p>
      </div>
    );
  }

  const verifiedCount = tenant.documents.filter(d => d.verified).length;
  const pendingCount = tenant.documents.filter(d => !d.verified).length;

  const getUploadTimeText = (uploadedAt?: string) => {
    if (!uploadedAt) return 'Upload date unknown';
    try {
      return `Uploaded ${formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })}`;
    } catch {
      return 'Upload date unknown';
    }
  };

  /* ================= DOCUMENT UPLOAD HANDLER ================= */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    const files = event instanceof DragEvent 
      ? event.dataTransfer?.files 
      : (event.target as HTMLInputElement).files;
    
    if (!files || !tenant) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setUploadMessage({ type: 'error', text: `Invalid file type: ${file.name}. Only PDF, JPG, PNG allowed.` });
        continue;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setUploadMessage({ type: 'error', text: `File too large: ${file.name}. Max 5MB allowed.` });
        continue;
      }

      setUploading(true);
      setUploadMessage(null);

      try {
        const formData = new FormData();
        
        // Determine document type from file name or add both
        const fileName = file.name.toLowerCase();
        const isAddressDoc = fileName.includes('address') || fileName.includes('bill') || fileName.includes('agreement');
        const isIdProof = fileName.includes('id') || fileName.includes('aadhaar') || fileName.includes('pan') || fileName.includes('passport');

        // Add the file with the correct field name from Django model
        if (isAddressDoc || (!isIdProof && i === 0)) {
          formData.append('address_doc', file);
          console.log('📤 Uploading as address_doc');
        } else if (isIdProof) {
          formData.append('id_proof', file);
          console.log('📤 Uploading as id_proof');
        } else {
          formData.append('id_proof', file);
          console.log('📤 Uploading as id_proof (default)');
        }

        // Update tenant with document
        // API interceptor will add Authorization headers automatically
        const response = await api.patch(`/tenants/${tenant.id}/`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

        console.log('✅ Document uploaded:', response.data);
        setUploadMessage({ 
          type: 'success', 
          text: `✅ ${file.name} uploaded successfully and sent to admin for verification` 
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Reload documents after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error: any) {
        console.error('❌ Upload failed:', error);
        setUploadMessage({ 
          type: 'error', 
          text: error.response?.data?.detail || error.response?.data?.error || `Failed to upload ${file.name}. Please try again.` 
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">My Documents</h1>
        <p className="page-subtitle">View your uploaded documents and verification status</p>
      </div>

      {/* Status Card */}
      <div className={cn(
        'stat-card',
        tenant.documentsVerified 
          ? 'bg-success/5 border-success/20' 
          : 'bg-warning/5 border-warning/20'
      )}>
        <div className="flex items-center gap-3 md:gap-4">
          <div className={cn(
            'h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center shrink-0',
            tenant.documentsVerified ? 'bg-success/10' : 'bg-warning/10'
          )}>
            {tenant.documentsVerified ? (
              <CheckCircle className="h-6 w-6 md:h-7 md:w-7 text-success" />
            ) : (
              <AlertCircle className="h-6 w-6 md:h-7 md:w-7 text-warning" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-semibold text-foreground">
              {tenant.documentsVerified ? 'All Documents Verified' : 'Verification Pending'}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              {tenant.documentsVerified 
                ? 'Your identity has been verified by the admin'
                : 'Some documents are pending verification by admin'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{tenant.documents.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Documents</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-success">{verifiedCount}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Verified</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock className="h-5 w-5 md:h-6 md:w-6 text-warning" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-foreground">Upload Documents</h2>
        </div>
        
        {/* Upload Status Message */}
        {uploadMessage && (
          <div className={cn(
            'p-3 md:p-4 rounded-lg mb-4 text-sm',
            uploadMessage.type === 'success' 
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          )}>
            {uploadMessage.text}
          </div>
        )}

        <div 
          className="border-2 border-dashed border-border rounded-xl p-6 md:p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            {uploading ? (
              <Loader className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            )}
          </div>
          <p className="font-medium text-foreground mb-1 text-sm md:text-base">
            {uploading ? 'Uploading...' : 'Upload new documents'}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Drag and drop or click to select files (PDF, JPG, PNG)
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="md:size-default"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Select Files'}
          </Button>
        </div>
      </div>

      {/* Documents List */}
      <div className="stat-card">
        <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">Uploaded Documents</h2>

        {tenant.documents && tenant.documents.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {tenant.documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 rounded-xl border',
                doc.verified 
                  ? 'bg-success/5 border-success/20' 
                  : 'bg-warning/5 border-warning/20'
              )}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={cn(
                  'h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0',
                  doc.verified ? 'bg-success/10' : 'bg-warning/10'
                )}>
                  <FileText className={cn(
                    'h-5 w-5 md:h-6 md:w-6',
                    doc.verified ? 'text-success' : 'text-warning'
                  )} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground capitalize text-sm md:text-base">
                    {doc.type.replace('_', ' ')}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getUploadTimeText(doc.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
                <span className={cn(
                  'status-badge text-xs',
                  doc.verified ? 'status-verified' : 'status-pending'
                )}>
                  {doc.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </>
                  )}
                </span>
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No documents uploaded</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload your documents above
            </p>
          </div>
        )}
      </div>

      {/* Important Info */}
      <div className="stat-card bg-info/5 border-info/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-info mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-foreground text-sm md:text-base">Required Documents</h3>
            <ul className="text-xs md:text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Address Proof (Electricity Bill, Rent Agreement, etc.)</li>
              <li>• ID Proof (Aadhaar Card, PAN Card, Passport, etc.)</li>
            </ul>
            <p className="text-xs md:text-sm text-muted-foreground mt-3">
              Please ensure all documents are clear and readable. Contact admin if you need to 
              update any documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
