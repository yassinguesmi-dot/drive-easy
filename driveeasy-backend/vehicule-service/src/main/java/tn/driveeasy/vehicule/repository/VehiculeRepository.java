package tn.driveeasy.vehicule.repository;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;
import tn.driveeasy.vehicule.domain.Vehicule;

@Repository
public class VehiculeRepository {
    private final ConcurrentHashMap<String, Vehicule> entries = new ConcurrentHashMap<>();

    public VehiculeRepository() {
        entries.put("vehicule-demo-1", new Vehicule("vehicule-demo-1", "123 TUN 4567", "Toyota", "Yaris",
                2022, "Blanc", "ESSENCE", "AUTOMATIQUE", 5, 24500,
                new BigDecimal("140.00"), "DISPONIBLE", "ECONOMIQUE",
                "https://images.unsplash.com/photo-1552519507-da3b142c6e3d"));
        entries.put("vehicule-demo-2", new Vehicule("vehicule-demo-2", "234 TUN 5678", "Hyundai", "Tucson",
                2023, "Gris", "DIESEL", "AUTOMATIQUE", 5, 12000,
                new BigDecimal("220.00"), "DISPONIBLE", "SUV",
                "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b"));
        entries.put("vehicule-demo-3", new Vehicule("vehicule-demo-3", "345 TUN 6789", "Renault", "Clio",
                2024, "Rouge", "ESSENCE", "MANUELLE", 5, 8000,
                new BigDecimal("115.00"), "DISPONIBLE", "ECONOMIQUE",
                "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=960&q=80"));
        entries.put("vehicule-demo-4", new Vehicule("vehicule-demo-4", "456 TUN 7890", "Kia", "Sportage",
                2024, "Noir", "HYBRIDE", "AUTOMATIQUE", 5, 9500,
                new BigDecimal("195.00"), "DISPONIBLE", "SUV",
                "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=960&q=80"));
    }

    public List<Vehicule> findAll() {
        return List.copyOf(entries.values());
    }

    public Optional<Vehicule> findById(String id) {
        return Optional.ofNullable(entries.get(id));
    }

    public boolean registrationExists(String registration, String exceptId) {
        return entries.values().stream().anyMatch(v -> v.immatriculation().equalsIgnoreCase(registration)
                && !v.id().equals(exceptId));
    }

    public void save(Vehicule vehicule) {
        entries.put(vehicule.id(), vehicule);
    }

    public void delete(String id) {
        entries.remove(id);
    }
}
