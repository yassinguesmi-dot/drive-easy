package tn.driveeasy.location.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.driveeasy.location.api.LocationDtos;
import tn.driveeasy.location.client.ClientClient;
import tn.driveeasy.location.client.VehicleClient;
import tn.driveeasy.location.domain.Location;
import tn.driveeasy.location.domain.Location.StatutLocation;
import tn.driveeasy.location.repository.LocationRepository;

@ExtendWith(MockitoExtension.class)
class LocationServiceTest {
    @Mock
    private VehicleClient vehicleClient;

    @Mock
    private ClientClient clientClient;

    private LocationRepository repository;
    private LocationService service;

    @BeforeEach
    void setUp() {
        repository = new LocationRepository();
        service = new LocationService(repository, vehicleClient, clientClient);
    }

    @Test
    void seedsCompletedDemoLocationsWithoutActiveReservations() {
        List<Location> demoLocations = repository.findAll();

        assertThat(demoLocations).hasSize(4)
                .allSatisfy(location -> {
                    assertThat(location.id()).startsWith("location-demo-");
                    assertThat(location.statut()).isEqualTo(StatutLocation.TERMINEE);
                    assertThat(location.dateRetourEffectif()).isNotNull()
                            .isBeforeOrEqualTo(LocalDate.now());
                });
        assertThat(demoLocations).extracting(Location::clientId)
                .containsExactlyInAnyOrder("client-demo-1", "client-demo-2", "client-demo-3", "client-demo-4");
    }

    @Test
    void availableVehiclesExcludesVehiclesAlreadyReservedForTheRequestedPeriod() {
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(3);
        Location reservation = new Location("existing", "client-1", "booked",
                start.plusDays(1), end, null, null, null, BigDecimal.TEN, BigDecimal.TEN,
                BigDecimal.ZERO, StatutLocation.RESERVEE, LocalDateTime.now());
        repository.save(reservation);

        LocationDtos.Vehicle free = vehicle("free");
        LocationDtos.Vehicle booked = vehicle("booked");
        when(vehicleClient.getAvailable(start, end)).thenReturn(List.of(free, booked));

        assertThat(service.availableVehicles(start, end)).containsExactly(free);
    }

    @Test
    void availableVehiclesIncludesVehiclesWithOnlyCancelledReservations() {
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = start.plusDays(3);
        Location cancelled = new Location("cancelled", "client-1", "vehicle-1",
                start, end, null, null, null, BigDecimal.TEN, BigDecimal.TEN,
                BigDecimal.ZERO, StatutLocation.ANNULEE, LocalDateTime.now());
        repository.save(cancelled);
        LocationDtos.Vehicle vehicle = vehicle("vehicle-1");
        when(vehicleClient.getAvailable(start, end)).thenReturn(List.of(vehicle));

        assertThat(service.availableVehicles(start, end)).containsExactly(vehicle);
    }

    private LocationDtos.Vehicle vehicle(String id) {
        return new LocationDtos.Vehicle(id, id, "Marque", "Modèle", 2026,
                "Noir", "ESSENCE", "MANUELLE", 5, 0,
                BigDecimal.TEN, "DISPONIBLE", "ECONOMIQUE", null);
    }
}
