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
  fetchCities,
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
}

interface Props {
  data: TenantFormData;
  updateField: (field: keyof TenantFormData, value: string | number) => void;
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
    const [stateSearch, setStateSearch] = useState("");
    const [citySearch, setCitySearch] = useState("");

    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    // Local selected IDs (backend numeric IDs), while form data keeps names
    const [selectedStateId, setSelectedStateId] = useState<string>("");
    const [selectedCityId, setSelectedCityId] = useState<string>("");

    useEffect(() => {
      const loadLocations = async () => {
        try {
          const [statesData, citiesData] = await Promise.all([
            fetchStates(),
            fetchCities(),
          ]);
          setStates(statesData);
          setCities(citiesData);
        } catch (error) {
          console.error("Failed to load states/cities:", error);
        }
      };

      loadLocations();
    }, []);

    // When options load or existing tenant data changes, sync selected IDs
    useEffect(() => {
      if (!states.length) return;
      if (!data.state) return;

      // data.state may be a name ("Jharkhand") or an ID string
      const stateById = states.find(
        (s) => String(s.id) === String(data.state),
      );
      const stateByName = states.find(
        (s) => s.name.toLowerCase() === data.state.toLowerCase(),
      );
      const match = stateById || stateByName;
      if (match) {
        setSelectedStateId(String(match.id));
      }
    }, [states, data.state]);

    useEffect(() => {
      if (!cities.length) return;
      if (!data.city) return;

      const cityById = cities.find(
        (c) => String(c.id) === String(data.city),
      );
      const cityByName = cities.find(
        (c) => c.name.toLowerCase() === data.city.toLowerCase(),
      );
      const match = cityById || cityByName;
      if (match) {
        setSelectedCityId(String(match.id));
      }
    }, [cities, data.city]);

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
              value={selectedStateId}
              onValueChange={(v) => {
                setSelectedStateId(v);
                // Store human-readable state name in form data
                const st = states.find((s) => String(s.id) === v);
                updateField("state", st ? st.name : "");
                // Reset city selection
                setSelectedCityId("");
                updateField("city", "");
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
              value={selectedCityId}
              disabled={!selectedStateId}
              onValueChange={(v) => {
                setSelectedCityId(v);
                const ct = cities.find((c) => String(c.id) === v);
                updateField("city", ct ? ct.name : "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {cities
                  .filter((c) => String(c.state) === selectedStateId)
                  .map((c) => (
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
