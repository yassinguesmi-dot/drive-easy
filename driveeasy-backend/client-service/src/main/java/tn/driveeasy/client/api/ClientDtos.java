package tn.driveeasy.client.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;

public final class ClientDtos {
    private ClientDtos() {}

    public record Upsert(
            @NotBlank String cin,
            @NotBlank String nom,
            @NotBlank String prenom,
            @NotNull LocalDate dateNaissance,
            @NotBlank @Email String email,
            @NotBlank String telephone,
            @NotBlank String adresse,
            @NotBlank String numeroPermis,
            @NotNull LocalDate dateExpirationPermis) {}

    public record Categorie(@NotBlank @Pattern(regexp = "STANDARD|FIDELE|VIP") String categorie) {}
    public record ActiveLocation(@NotBlank String locationId, boolean active) {}
    public record Eligibility(boolean eligible, int age, boolean permisValide, String raison) {}
}
