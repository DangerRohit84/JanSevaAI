from typing import List
import math
from collections import defaultdict


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def _grid_key(lat, lon, grid_size_meters=500):
    lat_deg = grid_size_meters / 111000
    lon_deg = grid_size_meters / (111000 * math.cos(math.radians(lat)))
    return (int(lat / lat_deg), int(lon / lon_deg))


def _get_nearby(point_idx, points, eps_meters, grid):
    lat, lon = points[point_idx]["latitude"], points[point_idx]["longitude"]
    key = _grid_key(lat, lon, eps_meters)
    nearby = []
    for dx in range(-1, 2):
        for dy in range(-1, 2):
            for idx in grid.get((key[0] + dx, key[1] + dy), []):
                if idx != point_idx:
                    dist = haversine_distance(
                        lat, lon,
                        points[idx]["latitude"], points[idx]["longitude"],
                    )
                    if dist <= eps_meters:
                        nearby.append(idx)
    return nearby


def dbscan_cluster(
    points: List[dict],
    eps_meters: float = 500,
    min_points: int = 3,
) -> List[dict]:
    if not points:
        return []

    grid = defaultdict(list)
    for i, p in enumerate(points):
        key = _grid_key(p["latitude"], p["longitude"], eps_meters)
        grid[key].append(i)

    labels = [-1] * len(points)
    cluster_id = 0

    for i in range(len(points)):
        if labels[i] != -1:
            continue

        neighbors = _get_nearby(i, points, eps_meters, grid)

        if len(neighbors) < min_points:
            labels[i] = -1
            continue

        labels[i] = cluster_id
        seed_set = list(neighbors)
        k = 0

        while k < len(seed_set):
            q = seed_set[k]
            k += 1

            if labels[q] == cluster_id:
                continue

            labels[q] = cluster_id

            q_lat, q_lon = points[q]["latitude"], points[q]["longitude"]
            q_key = _grid_key(q_lat, q_lon, eps_meters)
            q_neighbors = []
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    for idx in grid.get((q_key[0] + dx, q_key[1] + dy), []):
                        if idx != q:
                            dist = haversine_distance(
                                q_lat, q_lon,
                                points[idx]["latitude"], points[idx]["longitude"],
                            )
                            if dist <= eps_meters:
                                q_neighbors.append(idx)

            if len(q_neighbors) >= min_points:
                for n in q_neighbors:
                    if n not in seed_set and labels[n] == -1:
                        seed_set.append(n)

        cluster_id += 1

    clusters = defaultdict(list)
    for i, label in enumerate(labels):
        if label != -1:
            clusters[label].append(points[i])

    result = []
    for cid, cluster_points in clusters.items():
        lats = [p["latitude"] for p in cluster_points]
        lons = [p["longitude"] for p in cluster_points]
        result.append({
            "cluster_id": cid,
            "centroid_lat": sum(lats) / len(lats),
            "centroid_lon": sum(lons) / len(lons),
            "submission_count": len(cluster_points),
            "submission_ids": [p.get("id", "") for p in cluster_points],
        })

    return result
