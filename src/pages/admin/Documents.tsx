import React, { useState } from 'react';
import { FileText, Search, CheckCircle, Clock, Eye, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminDocuments() {
  const { tenants, verifyDocument, verifyAllDocuments } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified'>('all');

  const activeTenants = tenants.filter(t => t.isActive);

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
    verifyDocument(tenantId, docId);
    toast({ title: 'Document verified', description: 'Document has been marked as verified.' });
  };

  const handleVerifyAll = (tenantId: string) => {
    verifyAllDocuments(tenantId);
    toast({ title: 'All documents verified', description: 'All tenant documents have been verified.' });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Document Verification</h1>
        <p className="page-subtitle">Review and verify tenant documents</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="stat-card flex items-center gap-3 md:gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{activeTenants.length}</p>
            <p className="text-xs md:text-sm text-muted-foreground">Total Tenants</p>
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
                      Room #{tenant.roomNumber} • {tenant.email}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mt-4 pt-4 border-t border-border">
              {tenant.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center justify-between p-3 md:p-4 rounded-xl',
                    doc.verified ? 'bg-success/5 border border-success/20' : 'bg-warning/5 border border-warning/20'
                  )}
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <FileText className={cn(
                      'h-4 w-4 md:h-5 md:w-5 shrink-0',
                      doc.verified ? 'text-success' : 'text-warning'
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground capitalize text-sm truncate">
                        {doc.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{doc.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 shrink-0">
                    <Button
  size="sm"
  variant="ghost"
  className="h-8 w-8 p-0"
  onClick={() => {
    console.log("DOC DATA 👉", doc);
  }}
>
  <Eye className="h-4 w-4" />
</Button>

                    {!doc.verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyDoc(tenant.id, doc.id)}
                        className="h-8 px-2 text-xs"
                      >
                        Verify
                      </Button>
                    )}
                    {doc.verified && (
                      <span className="status-badge status-verified text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
