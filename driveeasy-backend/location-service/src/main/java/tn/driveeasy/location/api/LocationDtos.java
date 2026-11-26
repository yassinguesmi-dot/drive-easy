package tn.driveeasy.location.api;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import tn.driveeasy.location.domain.Location;

public final class LocationDtos {
    private LocationDtos() {}

    public record Reservation(
            @NotBlank String clientId,
            @NotBlank String vehiculeId,
            @NotNull LocalDate dateDebut,
            @NotNull LocalDate dateFinPrevue) {}

    public record Depart(@Min(0) int kmDepart) {}
    public record Retour(@Min(0) int kmRetour, LocalDate dateRetourEffectif) {}
    public record Simulation(String clientId, String vehiculeId, LocalDate dateDebut,
                             LocalDate dateFinPrevue, BigDecimal prixJournalier, String categorieClient,
                             long nombreJours, BigDecimal remise, BigDecimal montantEstime) {}
    public record Vehicle(String id, String immatriculation, String marque, String modele, int annee,
                          String couleur, String carburant, String boite, int nbPlaces, int kilometrage,
                          BigDecimal prixJournalier, String statut, String categorie, String imageUrl) {}
    public record Client(String id, String nom, String prenom, String categorieClient) {}
    public record Eligibility(boolean eligible, String raison) {}
    public record CategoryUpdate(String categorie) {}
    public record ActiveLocation(String locationId, boolean active) {}
    public record StatusUpdate(String statut) {}
    public record MileageUpdate(int kilometrage) {}
    public record Detail(Location location, Client client, Vehicle vehicule) {}
    public record Statistics(BigDecimal chiffreAffaires, double tauxOccupation, java.util.List<String> vehiculesLesPlusLoues) {}
    public record PageResult<T>(java.util.List<T> content, long totalElements, int totalPages, int number, int size) {}
}
