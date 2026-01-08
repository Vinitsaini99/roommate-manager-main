import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Upload, User, Home, FileText, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData, Room, Tenant } from '@/contexts/DataContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import TenantFormFields from './TenantFormFields';
import DocumentUploadFields from './DocumentUploadFields';


interface RoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TenantFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  aadhaarNumber: string;
  tokenMoney: number;
}

interface DocumentData {
  addressProof: File | null;
  idProof: File | null;
}

// const emptyDocuments = {
//   addressProof: null,
//   idProof: null,
// };


const createEmptyTenant = (): TenantFormData => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  aadhaarNumber: '',
  tokenMoney: 3000,
});

const emptyDocuments: DocumentData = {
  addressProof: null,
  idProof: null,
};


const STEPS = [
  { id: 1, title: 'Room Details', icon: Home },
  { id: 2, title: 'Tenant Details', icon: User },
  { id: 3, title: 'Documents', icon: FileText },
  { id: 4, title: 'Confirm', icon: Check },
];

export default function RoomModal({ room, isOpen, onClose }: RoomModalProps) {
  const { addTenant, updateRoom, addRoom, rooms, getRent, settings } = useData();
  const { toast } = useToast();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Room details state
  const [roomType, setRoomType] = useState<'single' | 'double' | 'triple'>('single');
  const [isAC, setIsAC] = useState(false);
  const [customRent, setCustomRent] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState<number>(0);
  
  // Tenant details state - using refs to track initialization
  const [formInitialized, setFormInitialized] = useState(false);
  const [tenant1, setTenant1] = useState(createEmptyTenant());
const [tenant2, setTenant2] = useState(createEmptyTenant());
const [tenant3, setTenant3] = useState(createEmptyTenant());
  const [documents1, setDocuments1] = useState<DocumentData>(emptyDocuments);
  const [documents2, setDocuments2] = useState<DocumentData>(emptyDocuments);
  const [documents3, setDocuments3] = useState<DocumentData>(emptyDocuments);

  // Initialize form ONLY when modal opens or room changes
  useEffect(() => {
    if (!isOpen) {
      setFormInitialized(false);
      return;
    }

    if (formInitialized) return;

    // Reset to step 1 when opening
    setCurrentStep(1);

    if (room) {
      setRoomType(room.type);
      setIsAC(room.isAC);
      setCustomRent(room.rent);
      setRoomNumber(room.roomNumber);
      
      if (room.tenants.length > 0) {
        const t1 = room.tenants[0];
        setTenant1({
          firstName: t1.firstName,
          lastName: t1.lastName,
          email: t1.email,
          phone: t1.phone,
          landmark: t1.landmark,
          city: t1.city,
          state: t1.state,
          pincode: t1.pincode,
          aadhaarNumber: t1.aadhaarNumber,
          tokenMoney: t1.tokenMoney,
        });
        if (t1.documents.length > 0) {
          setDocuments1({
  addressProof: null,
  idProof: null,
});
            
        }
      } else {
        setTenant1(createEmptyTenant());
        setDocuments1(emptyDocuments);
      }
      
      if (room.tenants.length > 1) {
        const t2 = room.tenants[1];
        setTenant2({
          firstName: t2.firstName,
          lastName: t2.lastName,
          email: t2.email,
          phone: t2.phone,
          landmark: t2.landmark,
          city: t2.city,
          state: t2.state,
          pincode: t2.pincode,
          aadhaarNumber: t2.aadhaarNumber,
          tokenMoney: t2.tokenMoney,
        });
        if (t2.documents.length > 0) {
         setDocuments2({
  addressProof: null,
  idProof: null,
});

        }
      } else {
        setTenant2(createEmptyTenant());
        setDocuments2(emptyDocuments);
      }

      if (room.tenants.length > 2) {
        const t3 = room.tenants[2];
        setTenant3({
          firstName: t3.firstName,
          lastName: t3.lastName,
          email: t3.email,
          phone: t3.phone,
          landmark: t3.landmark,
          city: t3.city,
          state: t3.state,
          pincode: t3.pincode,
          aadhaarNumber: t3.aadhaarNumber,
          tokenMoney: t3.tokenMoney,
        });
        if (t3.documents.length > 0) {
          setDocuments3({
  addressProof: null,
  idProof: null,
});

        }
      } else {
        setTenant3(createEmptyTenant());
        setDocuments3(emptyDocuments);
      }
    } else {
      // New room - reset all fields
      setRoomType('single');
      setIsAC(false);
      const maxRoomNumber = rooms.length > 0 ? Math.max(...rooms.map(r => r.roomNumber)) : 100;
      setRoomNumber(maxRoomNumber + 1);
      setCustomRent(getRent('single', false));
      setTenant1(createEmptyTenant());
      setTenant2(createEmptyTenant());
      setTenant3(createEmptyTenant());
      setDocuments1(emptyDocuments);
      setDocuments2(emptyDocuments);
      setDocuments3(emptyDocuments);
    }

    setFormInitialized(true);
  }, [isOpen, room, getRent, formInitialized]);

  // Update rent when room type/AC changes (but only after initialization)
  const handleRoomTypeChange = useCallback((value: 'single' | 'double' | 'triple') => {
    setRoomType(value);
    setCustomRent(getRent(value, isAC));
  }, [isAC, getRent]);

  const handleACChange = useCallback((value: boolean) => {
    setIsAC(value);
    setCustomRent(getRent(roomType, value));
  }, [roomType, getRent]);

  const getTenantCount = useMemo(() => {
    switch (roomType) {
      case 'single': return 1;
      case 'double': return 2;
      case 'triple': return 3;
      default: return 1;
    }
  }, [roomType]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    const currentRoomNumber = room ? room.roomNumber : roomNumber;

    if (!room) {
      // Create new room
      const newRoom: Omit<Room, 'id'> = {
        roomNumber: currentRoomNumber,
        type: roomType,
        isAC,
        rent: customRent,
        isOccupied: !!tenant1.firstName,
        tenants: [],
      };
      addRoom(newRoom);
    } else {
      // Update existing room
      updateRoom(room.id, {
        type: roomType,
        isAC,
        rent: customRent,
        isOccupied: !!tenant1.firstName,
      });
    }

    // Validate tenant 1
    if (tenant1.firstName && tenant1.email) {
      const newTenant: Omit<Tenant, 'id'> = {
        ...tenant1,
        roomNumber: currentRoomNumber,
        documents: [
          { id: `doc_${Date.now()}_1`, type: 'address_proof', name: documents1.addressProof?.name || 'Address Proof', url: '#', verified: false, uploadedAt: now },
          { id: `doc_${Date.now()}_2`, type: 'id_proof', name: documents1.idProof?.name || 'ID Proof', url: '#', verified: false, uploadedAt: now },
        ],
        documentsVerified: false,
        joinDate: now,
        isActive: true,
      };

      addTenant(newTenant);
    }

    // Validate tenant 2 for double/triple room
    if ((roomType === 'double' || roomType === 'triple') && tenant2.firstName && tenant2.email) {
      const newTenant2: Omit<Tenant, 'id'> = {
        ...tenant2,
        roomNumber: currentRoomNumber,
        documents: [
          { id: `doc_${Date.now()}_3`, type: 'address_proof', name: documents2.addressProof?.name || 'Address Proof', url: '#', verified: false, uploadedAt: now },
          { id: `doc_${Date.now()}_4`, type: 'id_proof', name: documents2.idProof?.name || 'ID Proof', url: '#', verified: false, uploadedAt: now },
        ],
        documentsVerified: false,
        joinDate: now,
        isActive: true,
      };

      addTenant(newTenant2);
    }

    // Validate tenant 3 for triple room
    if (roomType === 'triple' && tenant3.firstName && tenant3.email) {
      const newTenant3: Omit<Tenant, 'id'> = {
        ...tenant3,
        roomNumber: currentRoomNumber,
        documents: [
          { id: `doc_${Date.now()}_5`, type: 'address_proof', name: documents1.addressProof?.name || 'Address Proof', url: '#', verified: false, uploadedAt: now },
          { id: `doc_${Date.now()}_6`, type: 'id_proof', name: documents3.idProof?.name || 'ID Proof', url: '#', verified: false, uploadedAt: now },
        ],
        documentsVerified: false,
        joinDate: now,
        isActive: true,
      };

      addTenant(newTenant3);
    }

    // Update room
   // Update room
if (!room) {
  const newRoom: Omit<Room, 'id'> = {
    roomNumber: currentRoomNumber,
    type: roomType,
    isAC,
    rent: customRent,
    isOccupied: !!tenant1.firstName,
    tenants: [],
  };

  addRoom(newRoom); // ✅ now this works
} else {
  updateRoom(room.id, {
    type: roomType,
    isAC,
    rent: customRent,
    isOccupied: !!tenant1.firstName,
  });
}


    toast({
      title: 'Room saved successfully!',
      description: 'Room and tenant details have been saved.',
    });

    onClose();
  };

  // Memoized tenant form update handlers to prevent unnecessary re-renders
  const updateTenant1 = useCallback((field: keyof TenantFormData, value: string | number) => {
    setTenant1(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateTenant2 = useCallback((field: keyof TenantFormData, value: string | number) => {
    setTenant2(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateTenant3 = useCallback((field: keyof TenantFormData, value: string | number) => {
    setTenant3(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateDocuments1 = useCallback(
  (field: keyof DocumentData, value: File | null) => {
    setDocuments1(prev => ({ ...prev, [field]: value }));
  },
  []
);


  const updateDocuments2 = useCallback(
  (field: keyof DocumentData, value: File | null) => {
    setDocuments2(prev => ({ ...prev, [field]: value }));
  },
  []
);

const updateDocuments3 = useCallback(
  (field: keyof DocumentData, value: File | null) => {
    setDocuments3(prev => ({ ...prev, [field]: value }));
  },
  []
);


  // Step 1: Room Details
  const renderRoomDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-2">
          <Label>Room Type</Label>
          <Select value={roomType} onValueChange={(v) => handleRoomTypeChange(v as 'single' | 'double' | 'triple')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single Bed</SelectItem>
              <SelectItem value="double">Double Bed</SelectItem>
              <SelectItem value="triple">Triple Bed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>AC / Non-AC</Label>
          <Select value={isAC ? 'ac' : 'non-ac'} onValueChange={(v) => handleACChange(v === 'ac')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="non-ac">Non-AC</SelectItem>
              <SelectItem value="ac">AC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Room Rent (₹ / month)</Label>
        <Input
          type="number"
          value={customRent}
          onChange={(e) => setCustomRent(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Default: {formatCurrency(getRent(roomType, isAC))} for {roomType} {isAC ? 'AC' : 'Non-AC'}
        </p>
      </div>

      {/* Rent Rate Reference */}
      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground mb-3">Rent Rate Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Single Non-AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.singleNonAC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Single AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.singleAC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Double Non-AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.doubleNonAC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Double AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.doubleAC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Triple Non-AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.tripleNonAC)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Triple AC:</span>
            <span className="font-medium">{formatCurrency(settings.rentRates.tripleAC)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // // Tenant form component
  // const TenantFormFields = ({ 
  //   data, 
  //   updateField, 
  //   label
    
    
  // }: { 
  //   data: TenantFormData; 
  //   updateField: (field: keyof TenantFormData, value: string | number) => void;
  //   label: string;
  // }) => (
    
  //   <div className="space-y-4">
  //     <div className="flex items-center gap-2 text-foreground font-medium">
  //       <User className="h-4 w-4" />
  //       {label}
  //     </div>
  //     {/* {console.log(label, data)} */}
  //     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //       <div className="space-y-2">
  //         <Label>First Name *</Label>
  //         <Input
  //         type='text'
  //           value={data.firstName}
  //           onChange={(e) => updateField('firstName', e.target.value)}
  //           placeholder="Enter first name"
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <Label>Last Name *</Label>
  //         <Input
  //           value={data.lastName}
  //           onChange={(e) => updateField('lastName', e.target.value)}
  //           placeholder="Enter last name"
  //         />
  //       </div>
  //     </div>

  //     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //       <div className="space-y-2">
  //         <Label>Email *</Label>
  //         <Input
  //           type="email"
  //           value={data.email}
  //           onChange={(e) => updateField('email', e.target.value)}
  //           placeholder="tenant@email.com"
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <Label>Phone *</Label>
  //         <Input
  //           value={data.phone}
  //           onChange={(e) => updateField('phone', e.target.value)}
  //           placeholder="+91 98765 43210"
  //         />
  //       </div>
  //     </div>

  //     <div className="space-y-2">
  //       <Label>Landmark</Label>
  //       <Input
  //         value={data.landmark}
  //         onChange={(e) => updateField('landmark', e.target.value)}
  //         placeholder="Near main market..."
  //       />
  //     </div>

  //     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  //       <div className="space-y-2">
  //         <Label>City</Label>
  //         <Input
  //           value={data.city}
  //           onChange={(e) => updateField('city', e.target.value)}
  //           placeholder="Mumbai"
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <Label>State</Label>
  //         <Input
  //           value={data.state}
  //           onChange={(e) => updateField('state', e.target.value)}
  //           placeholder="Maharashtra"
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <Label>Pincode</Label>
  //         <Input
  //           value={data.pincode}
  //           onChange={(e) => updateField('pincode', e.target.value)}
  //           placeholder="400001"
  //         />
  //       </div>
  //     </div>

  //     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //       <div className="space-y-2">
  //         <Label>Aadhaar Number</Label>
  //         <Input
  //           value={data.aadhaarNumber}
  //           onChange={(e) => updateField('aadhaarNumber', e.target.value)}
  //           placeholder="XXXX XXXX XXXX"
  //         />
  //       </div>
  //       <div className="space-y-2">
  //         <Label>Token / Security Money (₹)</Label>
  //         <Input
  //           type="number"
  //           value={data.tokenMoney}
  //           onChange={(e) => updateField('tokenMoney', Number(e.target.value))}
  //         />
  //       </div>
  //     </div>
  //   </div>
  // );

  // Step 2: Tenant Details
  const renderTenantDetails = () => (
    <div className="space-y-6">
      <TenantFormFields
        data={tenant1}
        updateField={updateTenant1}
        label="Tenant 1"
      />

      {(roomType === 'double' || roomType === 'triple') && (
        <div className="pt-6 border-t border-border">
          <TenantFormFields
            data={tenant2}
            updateField={updateTenant2}
            label="Tenant 2"
          />
        </div>
      )}

      {roomType === 'triple' && (
        <div className="pt-6 border-t border-border">
          <TenantFormFields
            data={tenant3}
            updateField={updateTenant3}
            label="Tenant 3"
          />
        </div>
      )}
    </div>
  );

  // Document upload component
  // const DocumentUploadFields = ({
  //   documents,
  //   updateDoc,
  //   label
  // }: {
  //   documents: DocumentData;
  //   updateDoc: (field: keyof DocumentData, value: string) => void;
  //   label: string;
  // }) => (
  //   <div className="space-y-4">
  //     <div className="flex items-center gap-2 text-foreground font-medium">
  //       <FileText className="h-4 w-4" />
  //       {label}
  //     </div>
      
  //     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  //       <div className="space-y-2">
  //         <Label>Address Proof *</Label>
  //         <div className="flex items-center gap-2">
  //           <Input
  //             placeholder="Upload address proof"
  //             value={documents.addressProof}
  //             onChange={(e) => updateDoc('addressProof', e.target.value)}
  //             className="flex-1"
  //           />
  //           <Button size="icon" variant="outline" type="button">
  //             <Upload className="h-4 w-4" />
  //           </Button>
  //         </div>
  //       </div>
  //       <div className="space-y-2">
  //         <Label>ID Proof *</Label>
  //         <div className="flex items-center gap-2">
  //           <Input
  //             placeholder="Upload ID proof"
  //             value={documents.idProof}
  //             onChange={(e) => updateDoc('idProof', e.target.value)}
  //             className="flex-1"
  //           />
  //           <Button size="icon" variant="outline" type="button">
  //             <Upload className="h-4 w-4" />
  //           </Button>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  // Step 3: Documents
  const renderDocuments = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Please upload at least 2 documents for each tenant: Address Proof and ID Proof.
      </p>

      <DocumentUploadFields
        documents={documents1}
        updateDoc={updateDocuments1}
        label="Tenant 1 Documents"
      />

      {(roomType === 'double' || roomType === 'triple') && (
        <div className="pt-6 border-t border-border">
          <DocumentUploadFields
            documents={documents2}
            updateDoc={updateDocuments2}
            label="Tenant 2 Documents"
          />
        </div>
      )}

      {roomType === 'triple' && (
        <div className="pt-6 border-t border-border">
          <DocumentUploadFields
            documents={documents3}
            updateDoc={updateDocuments3}
            label="Tenant 3 Documents"
          />
        </div>
      )}
    </div>
  );

  // Step 4: Confirm
  const renderConfirm = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-xl p-4">
        <h4 className="font-medium text-foreground mb-3">Room Details</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Room Number:</span>
          <span className="font-medium">#{room ? room.roomNumber : roomNumber}</span>
          <span className="text-muted-foreground">Room Type:</span>
          <span className="font-medium">{roomType === 'single' ? 'Single' : roomType === 'double' ? 'Double' : 'Triple'} Bed</span>
          <span className="text-muted-foreground">AC Status:</span>
          <span className="font-medium">{isAC ? 'AC' : 'Non-AC'}</span>
          <span className="text-muted-foreground">Monthly Rent:</span>
          <span className="font-medium text-primary">{formatCurrency(customRent)}</span>
        </div>
      </div>

      {tenant1.firstName && (
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">Tenant 1</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{tenant1.firstName} {tenant1.lastName}</span>
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{tenant1.email}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{tenant1.phone}</span>
            <span className="text-muted-foreground">Token Money:</span>
            <span className="font-medium">{formatCurrency(tenant1.tokenMoney)}</span>
          </div>
        </div>
      )}

      {(roomType === 'double' || roomType === 'triple') && tenant2.firstName && (
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">Tenant 2</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{tenant2.firstName} {tenant2.lastName}</span>
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{tenant2.email}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{tenant2.phone}</span>
            <span className="text-muted-foreground">Token Money:</span>
            <span className="font-medium">{formatCurrency(tenant2.tokenMoney)}</span>
          </div>
        </div>
      )}

      {roomType === 'triple' && tenant3.firstName && (
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-3">Tenant 3</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{tenant3.firstName} {tenant3.lastName}</span>
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{tenant3.email}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{tenant3.phone}</span>
            <span className="text-muted-foreground">Token Money:</span>
            <span className="font-medium">{formatCurrency(tenant3.tokenMoney)}</span>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Please review the information above and click "Save Room" to confirm.
      </p>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderRoomDetails();
      case 2: return renderTenantDetails();
      case 3: return renderDocuments();
      case 4: return renderConfirm();
      default: return renderRoomDetails();
    }
  };

  return (
<Dialog
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) onClose();
  }}
>      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            {room ? `Room #${room.roomNumber}` : `Add New Room #${roomNumber}`}
          </DialogTitle>
        </DialogHeader>

        {/* Step Progress Indicator */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors',
                      currentStep >= step.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <step.icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <span className={cn(
                    'text-[10px] md:text-xs mt-1 text-center hidden sm:block',
                    currentStep >= step.id ? 'text-primary font-medium' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1 md:mx-2 transition-colors',
                      currentStep > step.id ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] py-4">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="w-full sm:w-auto"
          >
            {currentStep === 1 ? (
              'Cancel'
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} className="gradient-primary w-full sm:w-auto">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} className="gradient-primary w-full sm:w-auto">
              <Check className="h-4 w-4 mr-1" />
              Save Room
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
