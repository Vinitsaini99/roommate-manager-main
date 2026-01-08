import React from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface DocumentData {
  addressProof: File | null;
  idProof: File | null;
}

interface Props {
  documents: DocumentData;
  updateDoc: (field: keyof DocumentData, value: File | null) => void;
  label: string;
}

const DocumentUploadFields = React.memo(
  ({ documents, updateDoc, label }: Props) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <FileText className="h-4 w-4" />
          {label}
        </div>

        {/* Address Proof */}
        <div className="space-y-2">
          <Label>Address Proof *</Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                updateDoc('addressProof', e.target.files?.[0] || null)
              }
            />
            {documents.addressProof && (
              <span className="text-xs text-muted-foreground">
                {documents.addressProof.name}
              </span>
            )}
          </div>
        </div>

        {/* ID Proof */}
        <div className="space-y-2">
          <Label>ID Proof *</Label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                updateDoc('idProof', e.target.files?.[0] || null)
              }
            />
            {documents.idProof && (
              <span className="text-xs text-muted-foreground">
                {documents.idProof.name}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default DocumentUploadFields;
