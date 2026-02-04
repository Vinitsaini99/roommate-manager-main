import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import {
  fetchStates,
  fetchCitiesByState,
  type State,
  type City,
} from "@/api/location.api";

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
  stateId?: number | null; // Backend ID for state
  cityId?: number | null;  // Backend ID for city
}

interface Props {
  data: TenantFormData;
  updateField: (field: keyof TenantFormData, value: string | number | null) => void;
  label: string;
}
const formatAadhaar = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 12);

  return digits.replace(/(.{4})/g, "$1 ").trim();
};

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 5) return digits;

  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
};

const TenantFormFields = React.memo(
  ({ data, updateField, label }: Props) => {
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [statesLoading, setStatesLoading] = useState(true);
    const [citiesLoading, setCitiesLoading] = useState(false);

    // Local selected IDs (backend numeric IDs), while form data keeps names
    const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
    const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

    // Load states on component mount
    useEffect(() => {
      const loadStates = async () => {
        try {
          setStatesLoading(true);
          const statesData = await fetchStates();
          setStates(statesData);
          // console.log("✅ States loaded:", statesData.length);
        } catch (error) {
          // console.error("❌ Failed to load states:", error);
          setStates([]);
        } finally {
          setStatesLoading(false);
        }
      };

      loadStates();
    }, []);

    // Load cities when state is selected
    useEffect(() => {
      if (!selectedStateId) {
        setCities([]); // Clear cities if no state selected
        setSelectedCityId(null);
        return;
      }

      const loadCities = async () => {
        try {
          setCitiesLoading(true);
          const stateIdNum = parseInt(selectedStateId, 10);
          // console.log("📍 Fetching cities for state:", stateIdNum);
          const citiesData = await fetchCitiesByState(stateIdNum);
          setCities(citiesData);
          // console.log("✅ Cities loaded:", citiesData.length);
        } catch (error) {
          console.error(`❌ Failed to load cities for state ${selectedStateId}:`, error);
          setCities([]);
        } finally {
          setCitiesLoading(false);
        }
      };

      loadCities();
    }, [selectedStateId]);

    // When options load or existing tenant data changes, sync selected IDs
    useEffect(() => {
      if (!states.length) return;
      if (!data.state && data.stateId === undefined) return;

      // Try by stateId first (numeric ID from API)
      if (data.stateId !== undefined) {
        setSelectedStateId(String(data.stateId));
        return;
      }

      // Fallback: try by state name or ID from data.state
      const stateStr = String(data.state).trim();
      if (!stateStr) return;

      const stateById = states.find((s) => String(s.id) === stateStr);
      const stateByName = states.find(
        (s) => s.name.toLowerCase() === stateStr.toLowerCase(),
      );
      const match = stateById || stateByName;
      if (match) {
        setSelectedStateId(String(match.id));
      }
    }, [states, data.state, data.stateId]);

    useEffect(() => {
      if (!cities.length) return;
      if (!data.city && data.cityId === undefined) return;

      // Try by cityId first (numeric ID from API)
      if (data.cityId !== undefined) {
        setSelectedCityId(String(data.cityId));
        return;
      }

      // Fallback: try by city name or ID from data.city
      const cityStr = String(data.city).trim();
      if (!cityStr) return;

      const cityById = cities.find((c) => String(c.id) === cityStr);
      const cityByName = cities.find(
        (c) => c.name.toLowerCase() === cityStr.toLowerCase(),
      );
      const match = cityById || cityByName;
      if (match) {
        setSelectedCityId(String(match.id));
      }
    }, [cities, data.city, data.cityId]);

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
                updateField("phone", raw);
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
         
        {/* State / City / Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* State with Search */}
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={selectedStateId ?? ""}
              onValueChange={(v) => {
                // v is string id
                setSelectedStateId(v);

                const id = Number(v);
                const stateObj = states.find((s) => s.id === id);
                updateField("state", stateObj?.name || "");
                updateField("stateId", isNaN(id) ? null : id);

                // reset city selection and form city fields
                setSelectedCityId(null);
                updateField("city", "");
                updateField("cityId", null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* City with Search */}
          <div className="space-y-2">
            <Label>City</Label>
            <Select
              disabled={!selectedStateId}
              value={selectedCityId ?? ""}
              onValueChange={(v) => {
                setSelectedCityId(v);
                const id = Number(v);
                const cityObj = cities.find((c) => c.id === id);
                updateField("city", cityObj?.name || "");
                updateField("cityId", isNaN(id) ? null : id);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* Pincode */}
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
                updateField("aadhaarNumber", raw);
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
  },
);

export default TenantFormFields;
