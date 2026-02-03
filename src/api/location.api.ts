// src/api/location.api.ts
import api from "@/api/api";

export interface State {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  state: number;
}

// ✅ GET /states/
export const fetchStates = async (): Promise<State[]> => {
  const res = await api.get("/states/");
  return res.data;
};

// ✅ GET /cities/?state=ID
export const fetchCitiesByState = async (stateId: number): Promise<City[]> => {
  const res = await api.get(`/cities/?state=${stateId}`);
  return res.data;
};

// ✅ Cache for states and cities to avoid repeated API calls
let statesCache: State[] | null = null;
let citiesCache: City[] | null = null;

// ✅ Load all cities from backend (paginated endpoint)
const loadAllCities = async (): Promise<City[]> => {
  try {
    const res = await api.get("/cities/");
    return Array.isArray(res.data) ? res.data : res.data?.results || [];
  } catch (error) {
    console.warn("Failed to load all cities:", error);
    return [];
  }
};

// ✅ Helper to get state name by ID
export const getStateNameById = async (stateId: number | null): Promise<string> => {
  if (!stateId) return "";
  
  try {
    if (!statesCache) {
      statesCache = await fetchStates();
    }
    const state = statesCache.find((s) => s.id === stateId);
    return state?.name || "";
  } catch (error) {
    console.error("Failed to get state name:", error);
    return "";
  }
};

// ✅ Helper to get city name by ID
export const getCityNameById = async (cityId: number | null): Promise<string> => {
  if (!cityId) return "";
  
  try {
    if (!citiesCache) {
      citiesCache = await loadAllCities();
    }
    const city = citiesCache.find((c) => c.id === cityId);
    return city?.name || "";
  } catch (error) {
    console.error("Failed to get city name:", error);
    return "";
  }
};
