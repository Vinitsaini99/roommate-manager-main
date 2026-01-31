import React, { useMemo, useState } from 'react';
import { FileText, Search, CheckCircle, Clock, Eye, Check, Upload } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/api/api';

const BACKEND =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/';

export default function AdminDocuments() {
  const { tenants, rooms, fetchTenants, verifyDocument, verifyAllDocuments } = useData();

  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [uploadingTenantId, setUploadingTenantId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<Record<string, { address?: File; id?: File }>>({});

  const activeTenants = tenants.filter(t => t.isActive);

  const makeDocUrl = (path?: string | null) => {
    if (!path) return undefined;
    const url = String(path);
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = BACKEND.replace(/\/$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getRoomLabel = (tenant: any) => {
    const room = rooms.find((r) => r.id === tenant.roomPk || r.roomId === tenant.roomId);
    return room?.roomId || tenant.roomId || '—';
  };

  const filteredTenants = activeTenants.filter(tenant => {
    const matchesSearch = 
      `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'verified' && tenant.documentsVerified) ||
      (filter === 'pending' && !tenant.documentsVerified);
    return matchesSearch && matchesFilter;
  });

  const verifiedCount = activeTenants.filter(t => t.documentsVerified).length;
  const pendingCount = activeTenants.filter(t => !t.documentsVerified).length;

 const handleVerifyDoc = (tenantId: string, docId: string) => {
  verifyDocument(tenantId, docId); // ✅ bas call
};

const handleVerifyAll = (tenantId: string) => {
  verifyAllDocuments(tenantId); // ✅ bas call
};

  const tenantDocsStatus = useMemo(() => {
    return new Map(
      activeTenants.map((t: any) => {
        const rawAddress = t.addressDocUrl || t.address_doc || t.address_proof;
        const rawId = t.idProofUrl || t.id_proof || t.id_proof_doc;
        return [
          t.id,
          {
            address: makeDocUrl(rawAddress),
            id: makeDocUrl(rawId),
          },
        ];
      }),
    );
  }, [activeTenants]);

  const handleFileChange = (tenantId: string, type: 'address' | 'id', file?: File) => {
    setPendingFiles((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        [type]: file,
      },
    }));
  };

  const uploadForTenant = async (tenantId: string) => {
    const files = pendingFiles[tenantId];
    if (!files?.address && !files?.id) {
      toast({
        title: 'No file selected',
        description: 'Choose a document first.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    if (files.address) formData.append('address_doc', files.address);
    if (files.id) formData.append('id_proof', files.id);

    setUploadingTenantId(tenantId);
    try {
      await api.patch(`/tenants/${tenantId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: '✅ Uploaded', description: 'Document(s) uploaded successfully.' });
      setPendingFiles((prev) => {
        const next = { ...prev };
        delete next[tenantId];
        return next;
      });
      await fetchTenants();
    } catch (err: any) {
      toast({
        title: '❌ Upload failed',
        description: err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setUploadingTenantId(null);
    }
  };



  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Document Verification</h1>
        <p className="page-subtitle">Review and verify tenant documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">

      {/* TOTAL TENANTS */}
      <div
        className={`stat-card flex items-center gap-3 md:gap-4 cursor-pointer ${
          filter === "all" ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => setFilter("all")}
      >
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-foreground">
            {activeTenants.length}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            Total Tenants
          </p>
        </div>
      </div>

      {/* VERIFIED */}
      <div
        className={`stat-card flex items-center gap-3 md:gap-4 cursor-pointer ${
          filter === "verified" ? "ring-2 ring-success" : ""
        }`}
        onClick={() => setFilter("verified")}
      >
        <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-success/10 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-success" />
        </div>
        <div>
          <p className="text-xl md:text-2xl font-bold text-success">
            {verifiedCount}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground">
            Verified
          </p>
        </div>
      </div>

  {/* PENDING */}
  <div
    className={`stat-card flex items-center gap-3 md:gap-4 cursor-pointer ${
      filter === "pending" ? "ring-2 ring-warning" : ""
    }`}
    onClick={() => setFilter("pending")}
  >
    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-warning/10 flex items-center justify-center">
      <Clock className="h-5 w-5 md:h-6 md:w-6 text-warning" />
    </div>
    <div>
      <p className="text-xl md:text-2xl font-bold text-warning">
        {pendingCount}
      </p>
      <p className="text-xs md:text-sm text-muted-foreground">
        Pending
      </p>
    </div>
  </div>

</div>
      </div>


      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by tenant name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', 'pending', 'verified'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn(
                'whitespace-nowrap',
                filter === f ? 'gradient-primary' : ''
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tenant Documents List */}
      <div className="space-y-3 md:space-y-4">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="stat-card">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <span className="text-base md:text-lg font-medium text-primary-foreground">
                      {tenant.firstName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm md:text-base">
                      {tenant.firstName} {tenant.lastName}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      Room #{getRoomLabel(tenant)} • {tenant.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'status-badge text-xs',
                    tenant.documentsVerified ? 'status-verified' : 'status-pending'
                  )}>
                    {tenant.documentsVerified ? 'All Verified' : 'Pending'}
                  </span>
                  
                  {!tenant.documentsVerified && (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyAll(tenant.id)}
                      className="gradient-primary"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Verify All
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Documents + Upload missing */}
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {(() => {
                const status = tenantDocsStatus.get(tenant.id) || { address: undefined, id: undefined };
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border bg-muted/30">
                        <p className="text-sm font-medium text-foreground">Address Proof</p>
                        {status.address ? (
                          <div className="flex items-center justify-between mt-2">
                            <a
                              href={status.address}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline truncate"
                            >
                              View uploaded
                            </a>
                            <Button size="sm" variant="outline" asChild>
                              <a href={status.address} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <p className="text-xs text-muted-foreground">Not uploaded</p>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(tenant.id, 'address', e.target.files?.[0])}
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl border bg-muted/30">
                        <p className="text-sm font-medium text-foreground">ID Proof</p>
                        {status.id ? (
                          <div className="flex items-center justify-between mt-2">
                            <a
                              href={status.id}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline truncate"
                            >
                              View uploaded
                            </a>
                            <Button size="sm" variant="outline" asChild>
                              <a href={status.id} target="_blank" rel="noreferrer">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <p className="text-xs text-muted-foreground">Not uploaded</p>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(tenant.id, 'id', e.target.files?.[0])}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        className="gradient-primary"
                        onClick={() => uploadForTenant(tenant.id)}
                        disabled={uploadingTenantId === tenant.id}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadingTenantId === tenant.id ? 'Uploading...' : 'Upload selected'}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ))}

        {filteredTenants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center stat-card">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No tenants found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
