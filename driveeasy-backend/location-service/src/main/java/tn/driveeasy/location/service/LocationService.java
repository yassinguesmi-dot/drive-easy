package tn.driveeasy.location.service;

import feign.FeignException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tn.driveeasy.location.api.LocationDtos;
import tn.driveeasy.location.client.ClientClient;
import tn.driveeasy.location.client.VehicleClient;
import tn.driveeasy.location.domain.Location;
import tn.driveeasy.location.domain.Location.StatutLocation;
import tn.driveeasy.location.repository.LocationRepository;

@Service
public class LocationService {
    private static final Logger log = LoggerFactory.getLogger(LocationService.class);
    private static final BigDecimal LATE_MULTIPLIER = new BigDecimal("1.5");
    private final LocationRepository repository;
    private final VehicleClient vehicleClient;
    private final ClientClient clientClient;

    public LocationService(LocationRepository repository, VehicleClient vehicleClient, ClientClient clientClient) {
        this.repository = repository;
        this.vehicleClient = vehicleClient;
        this.clientClient = clientClient;
    }

    public LocationDtos.PageResult<Location> findAll(StatutLocation statut, String clientId, String vehiculeId,
                                  LocalDate dateDebut, LocalDate dateFin, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("page doit être >= 0 et size doit être compris entre 1 et 100.");
        }
        List<Location> filtered = repository.findAll().stream()
                .filter(location -> statut == null || location.statut() == statut)
                .filter(location -> clientId == null || location.clientId().equals(clientId))
                .filter(location -> vehiculeId == null || location.vehiculeId().equals(vehiculeId))
                .filter(location -> dateDebut == null || !location.dateFinPrevue().isBefore(dateDebut))
                .filter(location -> dateFin == null || !location.dateDebut().isAfter(dateFin))
                .sorted(Comparator.comparing(Location::dateCreation).reversed()).toList();
        int start = (int) Math.min((long) page * size, filtered.size());
        int end = Math.min(start + size, filtered.size());
        int totalPages = (int) Math.ceil((double) filtered.size() / size);
        return new LocationDtos.PageResult<>(filtered.subList(start, end), filtered.size(), totalPages, page, size);
    }

    public Location findById(String id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Location introuvable: " + id));
    }

    public LocationDtos.Detail detail(String id) {
        Location location = findById(id);
        return new LocationDtos.Detail(location, clientClient.getClient(location.clientId()),
                vehicleClient.getVehicle(location.vehiculeId()));
    }

    public List<LocationDtos.Vehicle> availableVehicles(LocalDate dateDebut, LocalDate dateFin) {
        validateDates(dateDebut, dateFin);
        return vehicleClient.getAvailable(dateDebut, dateFin).stream()
                .filter(vehicle -> !hasOverlap(vehicle.id(), dateDebut, dateFin))
                .toList();
    }

    public LocationDtos.Simulation simulate(LocationDtos.Reservation request) {
        validateDates(request.dateDebut(), request.dateFinPrevue());
        LocationDtos.Client client = clientClient.getClient(request.clientId());
        LocationDtos.Vehicle vehicle = vehicleClient.getVehicle(request.vehiculeId());
        if (!clientClient.getEligibility(request.clientId()).eligible()) {
            throw new ConflictException("Le client n'est pas éligible à la location.");
        }
        long days = rentalDays(request.dateDebut(), request.dateFinPrevue());
        BigDecimal rate = discount(client.categorieClient());
        BigDecimal total = vehicle.prixJournalier().multiply(BigDecimal.valueOf(days))
                .multiply(BigDecimal.ONE.subtract(rate)).setScale(2, RoundingMode.HALF_UP);
        return new LocationDtos.Simulation(client.id(), vehicle.id(), request.dateDebut(),
                request.dateFinPrevue(), vehicle.prixJournalier(), client.categorieClient(), days, rate, total);
    }

    public synchronized Location reserve(LocationDtos.Reservation request) {
        LocationDtos.Simulation quote = simulate(request);
        if (hasOverlap(request.vehiculeId(), request.dateDebut(), request.dateFinPrevue())) {
            throw new ConflictException("Le véhicule a déjà une réservation sur cette période.");
        }
        boolean available = vehicleClient.getAvailable(request.dateDebut(), request.dateFinPrevue()).stream()
                .anyMatch(vehicle -> vehicle.id().equals(request.vehiculeId()));
        if (!available) throw new ConflictException("Le véhicule n'est pas disponible pour cette période.");
        Location location = new Location(UUID.randomUUID().toString(), request.clientId(), request.vehiculeId(),
                request.dateDebut(), request.dateFinPrevue(), null, null, null, quote.prixJournalier(),
                quote.montantEstime(), BigDecimal.ZERO.setScale(2), StatutLocation.RESERVEE, LocalDateTime.now());
        repository.save(location);
        return location;
    }

    public synchronized Location start(String id, int kmDepart) {
        Location current = findById(id);
        if (current.statut() != StatutLocation.RESERVEE) {
            throw new ConflictException("Seule une réservation peut être démarrée.");
        }
        if (LocalDate.now().isBefore(current.dateDebut())) {
            throw new ConflictException("La location ne peut pas commencer avant la date de réservation.");
        }
        if (kmDepart < 0) throw new IllegalArgumentException("Le kilométrage ne peut pas être négatif.");
        LocationDtos.Vehicle vehicle = vehicleClient.getVehicle(current.vehiculeId());
        if (kmDepart < vehicle.kilometrage()) throw new IllegalArgumentException("Le kilométrage de départ doit être >= au compteur.");
        if (!"DISPONIBLE".equals(vehicle.statut())) throw new ConflictException("Le véhicule n'est plus disponible.");
        boolean vehicleMarkedRented = false;
        boolean clientMarkedActive = false;
        try {
            vehicleClient.updateStatus(current.vehiculeId(), new LocationDtos.StatusUpdate("LOUE"));
            vehicleMarkedRented = true;
            clientClient.setLocationActive(current.clientId(), new LocationDtos.ActiveLocation(id, true));
            clientMarkedActive = true;
            Location started = new Location(current.id(), current.clientId(), current.vehiculeId(),
                    current.dateDebut(), current.dateFinPrevue(), null, kmDepart, null, current.prixJournalierApplique(),
                    current.montantTotal(), current.penalite(), StatutLocation.EN_COURS, current.dateCreation());
            repository.save(started);
            return started;
        } catch (RuntimeException ex) {
            if (clientMarkedActive) {
                try {
                    clientClient.setLocationActive(current.clientId(), new LocationDtos.ActiveLocation(id, false));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation de location active pour {}", id, compensationError);
                }
            }
            if (vehicleMarkedRented) {
                try {
                    vehicleClient.updateStatus(current.vehiculeId(), new LocationDtos.StatusUpdate("DISPONIBLE"));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation du statut véhicule pour {}", id, compensationError);
                }
            }
            throw ex;
        }
    }

    public synchronized Location finish(String id, int kmRetour, LocalDate returnedOn) {
        Location current = findById(id);
        if (current.statut() != StatutLocation.EN_COURS) {
            throw new ConflictException("Seule une location en cours peut être clôturée.");
        }
        if (kmRetour < current.kmDepart()) throw new IllegalArgumentException("Le kilométrage retour doit être >= au départ.");
        LocationDtos.Vehicle currentVehicle = vehicleClient.getVehicle(current.vehiculeId());
        if (kmRetour < currentVehicle.kilometrage()) {
            throw new IllegalArgumentException("Le kilométrage retour ne peut pas être inférieur au compteur du véhicule.");
        }
        LocalDate returnDate = returnedOn == null ? LocalDate.now() : returnedOn;
        if (returnDate.isBefore(current.dateDebut()) || returnDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("La date de retour effective doit être comprise entre le début et aujourd'hui.");
        }
        long actualDays = rentalDays(current.dateDebut(), returnDate);
        BigDecimal base = current.prixJournalierApplique().multiply(BigDecimal.valueOf(actualDays))
                .multiply(BigDecimal.ONE.subtract(discount(clientClient.getClient(current.clientId()).categorieClient())));
        long lateDays = Math.max(0, ChronoUnit.DAYS.between(current.dateFinPrevue(), returnDate));
        BigDecimal penalty = current.prixJournalierApplique().multiply(LATE_MULTIPLIER)
                .multiply(BigDecimal.valueOf(lateDays)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(penalty).setScale(2, RoundingMode.HALF_UP);
        Location finished = new Location(current.id(), current.clientId(), current.vehiculeId(), current.dateDebut(),
                current.dateFinPrevue(), returnDate, current.kmDepart(), kmRetour, current.prixJournalierApplique(),
                total, penalty, StatutLocation.TERMINEE, current.dateCreation());

        LocationDtos.Client client = clientClient.getClient(current.clientId());
        int completed = (int) repository.findAll().stream()
                .filter(location -> location.clientId().equals(current.clientId()) && location.statut() == StatutLocation.TERMINEE)
                .count() + 1;
        String newCategory = completed >= 15 ? "VIP" : completed >= 5 ? "FIDELE" : client.categorieClient();
        boolean vehicleReleased = false;
        boolean mileageUpdated = false;
        boolean clientRentalClosed = false;
        boolean categoryChanged = false;
        try {
            vehicleClient.updateMileage(current.vehiculeId(), new LocationDtos.MileageUpdate(kmRetour));
            mileageUpdated = true;
            vehicleClient.updateStatus(current.vehiculeId(), new LocationDtos.StatusUpdate("DISPONIBLE"));
            vehicleReleased = true;
            clientClient.setLocationActive(current.clientId(), new LocationDtos.ActiveLocation(id, false));
            clientRentalClosed = true;
            if (!newCategory.equals(client.categorieClient())) {
                clientClient.updateCategory(current.clientId(), new LocationDtos.CategoryUpdate(newCategory));
                categoryChanged = true;
            }
            repository.save(finished);
            return finished;
        } catch (RuntimeException ex) {
            if (categoryChanged) {
                try {
                    clientClient.updateCategory(current.clientId(), new LocationDtos.CategoryUpdate(client.categorieClient()));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation de catégorie pour location {}", id, compensationError);
                }
            }
            if (clientRentalClosed) {
                try {
                    clientClient.setLocationActive(current.clientId(), new LocationDtos.ActiveLocation(id, true));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation du statut actif client pour location {}", id, compensationError);
                }
            }
            if (vehicleReleased) {
                try {
                    vehicleClient.updateStatus(current.vehiculeId(), new LocationDtos.StatusUpdate("LOUE"));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation du statut véhicule pour location {}", id, compensationError);
                }
            }
            if (mileageUpdated) {
                try {
                    vehicleClient.updateMileage(current.vehiculeId(),
                            new LocationDtos.MileageUpdate(currentVehicle.kilometrage()));
                } catch (RuntimeException compensationError) {
                    ex.addSuppressed(compensationError);
                    log.error("Échec de compensation du kilométrage pour location {}", id, compensationError);
                }
            }
            throw ex;
        }
    }

    public synchronized Location cancel(String id) {
        Location current = findById(id);
        if (current.statut() != StatutLocation.RESERVEE) {
            throw new ConflictException("Seule une réservation peut être annulée.");
        }
        Location cancelled = new Location(current.id(), current.clientId(), current.vehiculeId(),
                current.dateDebut(), current.dateFinPrevue(), null, null, null, current.prixJournalierApplique(),
                current.montantTotal(), current.penalite(), StatutLocation.ANNULEE, current.dateCreation());
        repository.save(cancelled);
        return cancelled;
    }

    public LocationDtos.Statistics statistics() {
        List<Location> locations = repository.findAll();
        LocalDate monthStart = LocalDate.now().withDayOfMonth(1);
        BigDecimal revenue = locations.stream().filter(location -> location.statut() == StatutLocation.TERMINEE)
                .filter(location -> location.dateRetourEffectif() != null && !location.dateRetourEffectif().isBefore(monthStart))
                .map(Location::montantTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        long active = locations.stream().filter(location -> location.statut() == StatutLocation.EN_COURS).count();
        long fleetSize = Math.max(1, vehicleClient.getVehicles().size());
        List<String> popular = locations.stream().collect(java.util.stream.Collectors.groupingBy(
                        Location::vehiculeId, java.util.stream.Collectors.counting()))
                .entrySet().stream().sorted(java.util.Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5).map(java.util.Map.Entry::getKey).toList();
        return new LocationDtos.Statistics(revenue, Math.min(1.0, (double) active / fleetSize), popular);
    }

    private boolean hasOverlap(String vehicleId, LocalDate start, LocalDate end) {
        return repository.findAll().stream()
                .filter(location -> location.vehiculeId().equals(vehicleId))
                .filter(location -> location.statut() == StatutLocation.RESERVEE || location.statut() == StatutLocation.EN_COURS)
                .anyMatch(location -> !end.isBefore(location.dateDebut()) && !start.isAfter(location.dateFinPrevue()));
    }

    private BigDecimal discount(String category) {
        return switch (category) {
            case "FIDELE" -> new BigDecimal("0.05");
            case "VIP" -> new BigDecimal("0.10");
            default -> BigDecimal.ZERO;
        };
    }

    private long rentalDays(LocalDate start, LocalDate end) {
        return Math.max(1, ChronoUnit.DAYS.between(start, end));
    }

    private void validateDates(LocalDate start, LocalDate end) {
        if (start == null || end == null || start.isBefore(LocalDate.now()) || end.isBefore(start)) {
            throw new IllegalArgumentException("Période de location invalide.");
        }
    }
}
