package tn.driveeasy.vehicule.api;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public final class VehiculeDtos {
    private VehiculeDtos() {}

    public record Upsert(
            @NotBlank String immatriculation,
            @NotBlank String marque,
            @NotBlank String modele,
            @Min(1900) int annee,
            @NotBlank String couleur,
            @NotBlank @Pattern(regexp = "(?i)ESSENCE|DIESEL|HYBRIDE|ELECTRIQUE") String carburant,
            @NotBlank @Pattern(regexp = "(?i)MANUELLE|AUTOMATIQUE") String boite,
            @Min(1) int nbPlaces,
            @Min(0) int kilometrage,
            @NotNull @DecimalMin(value = "0.01") BigDecimal prixJournalier,
            @NotBlank @Pattern(regexp = "(?i)ECONOMIQUE|COMPACTE|BERLINE|SUV|UTILITAIRE") String categorie,
            String imageUrl) {}

    public record Statut(@NotBlank @Pattern(regexp = "DISPONIBLE|LOUE|MAINTENANCE") String statut) {}
    public record Kilometrage(@Min(0) int kilometrage) {}
}
