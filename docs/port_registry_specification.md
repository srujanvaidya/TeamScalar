# Spatial Maritime Port Registry Specification

Provides a structured, embedded database of the top global maritime container hubs with coordinate mapping to allow spatial routing, haversine proximity queries, and nautical miles distance calculations.

## Data Schema (`PortRecord`)
* `port_id`: Unique UN/LOCODE or identifier key (e.g. `CNSHA`, `SGSIN`, `INNSA`).
* `port_name`: Official port name.
* `country`: Country name.
* `latitude` / `longitude`: GPS decimal degree coordinates.
* `water_body`: Associated sea/ocean.
* `channel_depth_m`: Max vessel draft depth capacity.
* `is_major_hub`: Boolean flag denoting primary container hubs.

## Key APIs
1. `get_port(identifier: str) -> Optional[PortRecord]`
2. `search_nearby_ports(lat: float, lon: float, radius_km: float) -> List[PortRecord]`
3. `compute_maritime_distance_nm(origin_id: str, dest_id: str) -> float`
4. `search_ports(query: str) -> List[PortRecord]`
