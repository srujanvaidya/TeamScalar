from typing import Optional, Dict, Any

class WarehouseInventoryManager:
    # In-memory storage for regional warehouses stock levels
    # SKU-PRECISION-SEMI-808 is the default
    inventory = {
        "WH_SHANGHAI": {"SKU-PRECISION-SEMI-808": 5000, "description": "East Asia Central Hub"},
        "WH_SINGAPORE": {"SKU-PRECISION-SEMI-808": 4000, "description": "Southeast Asia Hub"},
        "WH_DUBAI": {"SKU-PRECISION-SEMI-808": 3000, "description": "Middle East Hub"},
        "WH_ROTTERDAM": {"SKU-PRECISION-SEMI-808": 2500, "description": "European Hub"},
        "WH_NHAVA_SHEVA": {"SKU-PRECISION-SEMI-808": 1500, "description": "South Asia Hub"}
    }

    # Coordinate mapping for distance calculation
    warehouse_coords = {
        "WH_SHANGHAI": (31.2304, 121.4737),
        "WH_SINGAPORE": (1.3521, 103.8198),
        "WH_DUBAI": (25.2048, 55.2708),
        "WH_ROTTERDAM": (51.9244, 4.4777),
        "WH_NHAVA_SHEVA": (18.9500, 72.9500)
    }

    @classmethod
    def check_stock_availability(
        cls,
        sku_id: str,
        quantity: int,
        near_node: str,
        exclude_nodes: list[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Queries regional distribution centers to check if localized safety stock can fulfill the order.
        Returns closest warehouse with sufficient stock, transfer cost, and dispatch readiness.
        """
        from src.data.port_registry import GlobalPortRegistry
        registry = GlobalPortRegistry()
        target_port = registry.get_port(near_node)
        
        target_lat = target_port.latitude if target_port else 0.0
        target_lon = target_port.longitude if target_port else 0.0

        best_warehouse = None
        min_distance = float("inf")

        # Exclude warehouse located at the blocked origin node
        excluded_keywords = []
        if exclude_nodes:
            for node in exclude_nodes:
                excluded_keywords.append(node.replace("PORT_", "").replace("_01", "").replace("_02", "").upper())

        for wh, skus in cls.inventory.items():
            wh_keyword = wh.replace("WH_", "").upper()
            should_exclude = False
            for kw in excluded_keywords:
                if kw == wh_keyword or kw in wh_keyword or wh_keyword in kw:
                    should_exclude = True
                    break
            if should_exclude:
                continue
                
            stock = skus.get(sku_id, 0)
            if stock >= quantity:
                # Compute distance between warehouse and target node
                wh_lat, wh_lon = cls.warehouse_coords[wh]
                # Haversine distance
                dist = registry._haversine(target_lat, target_lon, wh_lat, wh_lon)
                if dist < min_distance:
                    min_distance = dist
                    best_warehouse = wh

        if best_warehouse:
            # Transfer cost scale: $5 per kilometer, minimum $2000
            transfer_cost = max(2000.0, round(min_distance * 5.0, 2))
            # Dispatch readiness: 2 hours standard prep + 1 hour per 100km distance, capped at 48 hours
            dispatch_readiness_hours = min(48.0, round(2.0 + (min_distance / 100.0), 1))
            
            return {
                "warehouse_id": best_warehouse,
                "available_stock": cls.inventory[best_warehouse][sku_id],
                "transfer_cost_usd": transfer_cost,
                "dispatch_readiness_hours": dispatch_readiness_hours,
                "description": cls.inventory[best_warehouse]["description"]
            }

        return None
