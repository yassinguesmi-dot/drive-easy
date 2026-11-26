package tn.driveeasy.client.service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import tn.driveeasy.client.api.ClientDtos;
import tn.driveeasy.client.domain.Client;
import tn.driveeasy.client.repository.ClientRepository;

@Service
public class ClientService {
    private final ClientRepository repository;

    public ClientService(ClientRepository repository) { this.repository = repository; }

    public List<Client> findAll(String query) {
        return repository.findAll().stream()
                .filter(client -> query == null || contains(client.nom(), query) || contains(client.prenom(), query)
                        || contains(client.cin(), query) || contains(client.email(), query))
                .toList();
    }

    public Client findById(String id) {
        return repository.findById(id).orElseThrow(() -> new NotFoundException("Client introuvable: " + id));
    }

    public synchronized Client create(ClientDtos.Upsert input) {
        ensureUnique(input, null);
        Client client = toEntity(UUID.randomUUID().toString(), input, "STANDARD", 0, LocalDate.now());
        repository.save(client);
        return client;
    }

    public synchronized Client update(String id, ClientDtos.Upsert input) {
        Client current = findById(id);
        ensureUnique(input, id);
        Client updated = toEntity(id, input, current.categorieClient(), current.locationsTerminees(), current.dateInscription());
        repository.save(updated);
        return updated;
    }

    public ClientDtos.Eligibility eligibility(String id) {
        Client client = findById(id);
        int age = Period.between(client.dateNaissance(), LocalDate.now()).getYears();
        boolean permitValid = !client.dateExpirationPermis().isBefore(LocalDate.now());
        boolean eligible = age >= 21 && permitValid;
        String reason = eligible ? "Client éligible." : age < 21 ? "Le client doit avoir au moins 21 ans."
                : "Le permis de conduire est expiré.";
        return new ClientDtos.Eligibility(eligible, age, permitValid, reason);
    }

    public Client updateCategory(String id, String category) {
        Client current = findById(id);
        if (!List.of("STANDARD", "FIDELE", "VIP").contains(category)) {
            throw new IllegalArgumentException("Catégorie invalide: " + category);
        }
        Client updated = new Client(current.id(), current.cin(), current.nom(), current.prenom(),
                current.dateNaissance(), current.email(), current.telephone(), current.adresse(),
                current.numeroPermis(), current.dateExpirationPermis(), category,
                current.dateInscription(), current.locationsTerminees());
        repository.save(updated);
        return updated;
    }

    public synchronized void setLocationActive(String id, String locationId, boolean active) {
        findById(id);
        repository.setLocationActive(id, locationId, active);
    }

    public synchronized void delete(String id) {
        findById(id);
        if (repository.hasActiveLocations(id)) throw new ConflictException("Un client avec une location en cours ne peut pas être supprimé.");
        repository.delete(id);
    }

    private void ensureUnique(ClientDtos.Upsert input, String exceptId) {
        if (repository.uniqueValueExists("cin", input.cin().trim(), exceptId)) throw new ConflictException("CIN déjà utilisé.");
        if (repository.uniqueValueExists("email", input.email().trim(), exceptId)) throw new ConflictException("Email déjà utilisé.");
        if (repository.uniqueValueExists("numeroPermis", input.numeroPermis().trim(), exceptId)) {
            throw new ConflictException("Numéro de permis déjà utilisé.");
        }
        if (input.dateNaissance().isAfter(LocalDate.now())) throw new IllegalArgumentException("Date de naissance invalide.");
    }

    private Client toEntity(String id, ClientDtos.Upsert input, String category, int completed, LocalDate registeredOn) {
        return new Client(id, input.cin().trim(), input.nom().trim(), input.prenom().trim(),
                input.dateNaissance(), input.email().trim().toLowerCase(), input.telephone().trim(),
                input.adresse().trim(), input.numeroPermis().trim(), input.dateExpirationPermis(),
                category, registeredOn, completed);
    }

    private boolean contains(String value, String query) {
        return value.toLowerCase().contains(query.toLowerCase());
    }
}
