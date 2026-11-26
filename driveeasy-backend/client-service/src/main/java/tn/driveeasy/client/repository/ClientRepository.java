package tn.driveeasy.client.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;
import tn.driveeasy.client.domain.Client;

@Repository
public class ClientRepository {
    private final ConcurrentHashMap<String, Client> entries = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Set<String>> activeLocations = new ConcurrentHashMap<>();

    public ClientRepository() {
        LocalDate today = LocalDate.now();
        Client demo = new Client("client-demo-1", "12345678", "Ben Ali", "Amira",
                LocalDate.of(1995, 6, 12), "amira@example.com", "+21620000001", "Tunis",
                "TN-DEMO-001", today.plusYears(3), "STANDARD", today, 1);
        entries.put(demo.id(), demo);
        entries.put("client-demo-2", new Client("client-demo-2", "23456789", "Trabelsi", "Yassine",
                LocalDate.of(1988, 3, 24), "yassine.demo@example.com", "+21620000002", "Sousse",
                "TN-DEMO-002", today.plusYears(3), "STANDARD", today, 1));
        entries.put("client-demo-3", new Client("client-demo-3", "34567890", "Mansour", "Nour",
                LocalDate.of(1992, 9, 8), "nour.demo@example.com", "+21620000003", "Sfax",
                "TN-DEMO-003", today.plusYears(3), "STANDARD", today, 1));
        entries.put("client-demo-4", new Client("client-demo-4", "45678901", "Gharbi", "Sami",
                LocalDate.of(1985, 1, 17), "sami.demo@example.com", "+21620000004", "Tunis",
                "TN-DEMO-004", today.plusYears(3), "STANDARD", today, 1));
    }

    public List<Client> findAll() { return List.copyOf(entries.values()); }
    public Optional<Client> findById(String id) { return Optional.ofNullable(entries.get(id)); }
    public void save(Client client) { entries.put(client.id(), client); }
    public void delete(String id) {
        entries.remove(id);
        activeLocations.remove(id);
    }
    public void setLocationActive(String clientId, String locationId, boolean active) {
        Set<String> locations = activeLocations.computeIfAbsent(clientId, ignored -> ConcurrentHashMap.newKeySet());
        if (active) locations.add(locationId);
        else locations.remove(locationId);
    }
    public boolean hasActiveLocations(String clientId) {
        return !activeLocations.getOrDefault(clientId, Set.of()).isEmpty();
    }
    public boolean uniqueValueExists(String field, String value, String exceptId) {
        return entries.values().stream().anyMatch(client -> {
            if (client.id().equals(exceptId)) return false;
            return switch (field) {
                case "cin" -> client.cin().equalsIgnoreCase(value);
                case "email" -> client.email().equalsIgnoreCase(value);
                case "numeroPermis" -> client.numeroPermis().equalsIgnoreCase(value);
                default -> false;
            };
        });
    }
}
