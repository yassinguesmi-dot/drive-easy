package tn.driveeasy.vehicule.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tn.driveeasy.vehicule.api.VehiculeDtos;
import tn.driveeasy.vehicule.domain.Vehicule;
import tn.driveeasy.vehicule.repository.VehiculeRepository;

@Service
public class VehiculeService {
    private final VehiculeRepository repository;

    public VehiculeService(VehiculeRepository repository) {
        this.repository = repository;
    }

    public List<Vehicule> findAll(String categorie, String carburant, String statut, BigDecimal prixMax) {
        return repository.findAll().stream()
                .filter(v -> categorie == null || v.categorie().equalsIgnoreCase(categorie))
                .filter(v -> carburant == null || v.carburant().equalsIgnoreCase(carburant))
                .filter(v -> statut == null || v.statut().equalsIgnoreCase(statut))
                .filter(v -> prixMax == null || v.prixJournalier().compareTo(prixMax) <= 0)
                .toList();
    }

    public List<Vehicule> available(LocalDate dateDebut, LocalDate dateFin) {
        if (dateDebut == null || dateFin == null || dateFin.isBefore(dateDebut)) {
            throw new IllegalArgumentException("dateDebut et dateFin sont requises; dateFin doit être postérieure ou égale.");
        }
        return findAll(null, null, "DISPONIBLE", null);
    }

    public Vehicule findById(String id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Véhicule introuvable: " + id));
    }

    public synchronized Vehicule create(VehiculeDtos.Upsert input) {
        validateYear(input.annee());
        ensureUniqueRegistration(input.immatriculation(), null);
        Vehicule created = toEntity(UUID.randomUUID().toString(), input, "DISPONIBLE");
        repository.save(created);
        return created;
    }

    public synchronized Vehicule update(String id, VehiculeDtos.Upsert input) {
        Vehicule current = findById(id);
        validateYear(input.annee());
        ensureUniqueRegistration(input.immatriculation(), id);
        Vehicule updated = toEntity(current.id(), input, current.statut());
        repository.save(updated);
        return updated;
    }

    public synchronized Vehicule updateStatus(String id, String statut) {
        Vehicule current = findById(id);
        if (!List.of("DISPONIBLE", "LOUE", "MAINTENANCE").contains(statut)) {
            throw new IllegalArgumentException("Statut invalide: " + statut);
        }
        Vehicule updated = new Vehicule(current.id(), current.immatriculation(), current.marque(), current.modele(),
                current.annee(), current.couleur(), current.carburant(), current.boite(), current.nbPlaces(),
                current.kilometrage(), current.prixJournalier(), statut, current.categorie(), current.imageUrl());
        repository.save(updated);
        return updated;
    }

    public synchronized Vehicule updateMileage(String id, int kilometrage) {
        Vehicule current = findById(id);
        if (kilometrage < current.kilometrage()) {
            throw new IllegalArgumentException("Le kilométrage ne peut pas diminuer.");
        }
        Vehicule updated = new Vehicule(current.id(), current.immatriculation(), current.marque(), current.modele(),
                current.annee(), current.couleur(), current.carburant(), current.boite(), current.nbPlaces(),
                kilometrage, current.prixJournalier(), current.statut(), current.categorie(), current.imageUrl());
        repository.save(updated);
        return updated;
    }

    public synchronized void delete(String id) {
        Vehicule current = findById(id);
        if ("LOUE".equals(current.statut())) {
            throw new ConflictException("Un véhicule loué ne peut pas être supprimé.");
        }
        repository.delete(id);
    }

    private void ensureUniqueRegistration(String registration, String exceptId) {
        if (repository.registrationExists(registration.trim(), exceptId)) {
            throw new ConflictException("Immatriculation déjà utilisée: " + registration);
        }
    }

    private void validateYear(int year) {
        if (year < 1900 || year > LocalDate.now().getYear()) {
            throw new IllegalArgumentException("L'année du véhicule doit être comprise entre 1900 et l'année courante.");
        }
    }

    private Vehicule toEntity(String id, VehiculeDtos.Upsert input, String statut) {
        return new Vehicule(id, input.immatriculation().trim().toUpperCase(), input.marque(), input.modele(),
                input.annee(), input.couleur(), input.carburant().toUpperCase(), input.boite().toUpperCase(),
                input.nbPlaces(), input.kilometrage(), input.prixJournalier(), statut,
                input.categorie().toUpperCase(), input.imageUrl());
    }
}
