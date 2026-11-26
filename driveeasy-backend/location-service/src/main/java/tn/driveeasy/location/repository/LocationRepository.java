package tn.driveeasy.location.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;
import tn.driveeasy.location.domain.Location;
import tn.driveeasy.location.domain.Location.StatutLocation;

@Repository
public class LocationRepository {
    private final ConcurrentHashMap<String, Location> entries = new ConcurrentHashMap<>();

    public LocationRepository() {
        LocalDate today = LocalDate.now();
        seedCompletedLocation("location-demo-1", "client-demo-1", "vehicule-demo-1",
                today.minusDays(3), today.minusDays(1), 24500, 24545, "140.00", "280.00");
        seedCompletedLocation("location-demo-2", "client-demo-2", "vehicule-demo-2",
                today.minusDays(7), today.minusDays(4), 12000, 12120, "220.00", "660.00");
        seedCompletedLocation("location-demo-3", "client-demo-3", "vehicule-demo-3",
                today.minusDays(10), today.minusDays(8), 8000, 8035, "115.00", "230.00");
        seedCompletedLocation("location-demo-4", "client-demo-4", "vehicule-demo-4",
                today.minusDays(5), today.minusDays(2), 9500, 9580, "195.00", "585.00");
    }

    public List<Location> findAll() { return List.copyOf(entries.values()); }
    public Optional<Location> findById(String id) { return Optional.ofNullable(entries.get(id)); }
    public void save(Location location) { entries.put(location.id(), location); }

    private void seedCompletedLocation(String id, String clientId, String vehicleId,
                                       LocalDate start, LocalDate returned, int startMileage,
                                       int returnMileage, String dailyRate, String total) {
        entries.put(id, new Location(id, clientId, vehicleId, start, returned, returned,
                startMileage, returnMileage, new BigDecimal(dailyRate), new BigDecimal(total),
                BigDecimal.ZERO.setScale(2), StatutLocation.TERMINEE,
                returned.atStartOfDay().plusHours(12)));
    }
}
