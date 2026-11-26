package tn.driveeasy.location.repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;
import tn.driveeasy.location.domain.Location;

@Repository
public class LocationRepository {
    private final ConcurrentHashMap<String, Location> entries = new ConcurrentHashMap<>();

    public List<Location> findAll() { return List.copyOf(entries.values()); }
    public Optional<Location> findById(String id) { return Optional.ofNullable(entries.get(id)); }
    public void save(Location location) { entries.put(location.id(), location); }
}
