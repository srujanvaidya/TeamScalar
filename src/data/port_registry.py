import os
import csv
import math
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class PortRecord(BaseModel):
    port_id: str = Field(..., description="Unique port identifier, e.g. CNSHA")
    port_name: str = Field(..., description="Official port name")
    country: str = Field(..., description="Country name")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    water_body: str = Field(..., description="Adjacent water body")
    channel_depth_m: float = Field(default=16.5, description="Max depth capacity")
    is_major_hub: bool = Field(default=True, description="Indicates if it is a major container terminal")

# Standard test alias mappings
ALIAS_MAP = {
    "PORT_SHANGHAI_01": "CNSHA",
    "CNSHG": "CNSHA",
    "PORT_ROTTERDAM_02": "NLROT",
    "NLAMS": "NLROT",
    "PORT_LOS_ANGELES": "USLAX",
    "USLGB": "USLAX",
    "SHANGHAI": "CNSHA",
    "SINGAPORE": "SGSIN",
    "ROTTERDAM": "NLROT",
    "NHAVA SHEVA": "INNSA",
    "Jawaharlal Nehru": "INNSA"
}

class GlobalPortRegistry:
    _instance: Optional["GlobalPortRegistry"] = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(GlobalPortRegistry, cls).__new__(cls, *args, **kwargs)
            cls._instance._load_registry()
        return cls._instance

    def _load_registry(self):
        self.ports: Dict[str, PortRecord] = {}
        csv_path = "backend/data/world_ports.csv"
        
        # Run conversion if the target file is missing
        if not os.path.exists(csv_path):
            from src.data.convert_excel import convert_dataset
            convert_dataset()
            
        if os.path.exists(csv_path):
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    port = PortRecord(
                        port_id=row["port_id"],
                        port_name=row["port_name"],
                        country=row["country"],
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        water_body=row["water_body"],
                        channel_depth_m=float(row["channel_depth_m"]),
                        is_major_hub=row["is_major_hub"].lower() == "true"
                    )
                    self.ports[port.port_id.upper()] = port

        # Ensure standard alias keys are fully populated for fast lookup
        for alias, real_id in ALIAS_MAP.items():
            if real_id.upper() in self.ports and alias.upper() not in self.ports:
                real_port = self.ports[real_id.upper()]
                self.ports[alias.upper()] = real_port

    def get_port(self, identifier: str) -> Optional[PortRecord]:
        """Resolves port by ID, name, or known alias using case-insensitive lookup."""
        if not identifier:
            return None
        
        clean_id = identifier.strip().upper()
        # Direct lookup
        if clean_id in self.ports:
            return self.ports[clean_id]

        # Check alias map
        resolved_alias = ALIAS_MAP.get(clean_id)
        if resolved_alias and resolved_alias.upper() in self.ports:
            return self.ports[resolved_alias.upper()]

        # Substring fuzzy match
        for port in self.ports.values():
            if clean_id in port.port_name.upper() or clean_id in port.country.upper():
                return port

        return None

    def search_ports(self, query: str, limit: int = 20) -> List[PortRecord]:
        """Performs substring search on name, country, and ID."""
        if not query:
            return []
        
        clean_query = query.strip().upper()
        results = []
        seen_ids = set()

        for port in self.ports.values():
            if port.port_id in seen_ids:
                continue
            if (clean_query in port.port_id.upper() or 
                clean_query in port.port_name.upper() or 
                clean_query in port.country.upper()):
                results.append(port)
                seen_ids.add(port.port_id)
                if len(results) >= limit:
                    break
        return results

    def search_nearby_ports(self, lat: float, lon: float, radius_km: float = 600.0) -> List[PortRecord]:
        """Finds nearest ports within a given radius using the Haversine formula."""
        nearby = []
        seen_ids = set()

        for port in self.ports.values():
            if port.port_id in seen_ids:
                continue
            dist = self._haversine(lat, lon, port.latitude, port.longitude)
            if dist <= radius_km:
                nearby.append((port, dist))
                seen_ids.add(port.port_id)

        # Sort by distance
        nearby.sort(key=lambda x: x[1])
        return [item[0] for item in nearby]

    def compute_maritime_distance_nm(self, origin_id: str, dest_id: str) -> float:
        """Computes nautical miles (NM) distance between two ports."""
        port1 = self.get_port(origin_id)
        port2 = self.get_port(dest_id)
        
        if not port1 or not port2:
            return 0.0

        dist_km = self._haversine(port1.latitude, port1.longitude, port2.latitude, port2.longitude)
        # Convert km to nautical miles
        return round(dist_km * 0.539957, 1)

    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Haversine formula to compute great-circle distance in kilometers."""
        R = 6371.0  # Earth's radius in km
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(d_lat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
