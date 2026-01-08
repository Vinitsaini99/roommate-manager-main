import React from "react";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TenantFormData {
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

interface Props {
  data: TenantFormData;
  updateField: (field: keyof TenantFormData, value: string | number) => void;
  label: string;
}

const formatAadhaar = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 12);

  return digits
    .replace(/(.{4})/g, "$1 ")
    .trim();
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 5) return digits;

  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const TenantFormFields = React.memo(({ data, updateField, label }: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground font-medium">
        <User className="h-4 w-4" />
        {label}
      </div>

      {/* Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name *</Label>
          <Input
            required
            value={data.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Enter first name"
          />
        </div>

        <div className="space-y-2">
          <Label>Last Name *</Label>
          <Input
            required
            value={data.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      {/* Email / Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            required
            type="email"
            value={data.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="tenant@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Phone Number *</Label>
         <Input
  required
  inputMode="numeric"
  value={formatPhone(data.phone)}
  onChange={(e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
    updateField("phone", raw); // 🔥 backend-safe
  }}
  placeholder="XXXXX XXXXX"
/>

        </div>
      </div>

      {/* Landmark */}
      <div className="space-y-2">
        <Label>Landmark</Label>
        <Input
          value={data.landmark}
          onChange={(e) => updateField("landmark", e.target.value)}
          placeholder="Near main market..."
        />
      </div>

      {/* City / State / Pincode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input
            value={data.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="City name"
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={data.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="State name"
          />
        </div>

        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input
            inputMode="numeric"
            maxLength={6}
            value={data.pincode}
            onChange={(e) =>
              updateField("pincode", e.target.value.replace(/\D/g, ""))
            }
            placeholder="6 digit pincode"
          />
        </div>
      </div>

      {/* Aadhaar / Token */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Aadhaar Number *</Label>
         <Input
  required
  inputMode="numeric"
  value={formatAadhaar(data.aadhaarNumber)}
  onChange={(e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    updateField("aadhaarNumber", raw); // 🔥 backend-safe (no spaces)
  }}
  placeholder="XXXX XXXX XXXX"
/>
        </div>

        <div className="space-y-2">
          <Label>Token / Security Money (₹)</Label>
          <Input
            type="number"
            min={0}
            value={data.tokenMoney}
            onChange={(e) =>
              updateField("tokenMoney", Number(e.target.value))
            }
          />
        </div>
      </div>
    </div>
  );
});

export default TenantFormFields;
