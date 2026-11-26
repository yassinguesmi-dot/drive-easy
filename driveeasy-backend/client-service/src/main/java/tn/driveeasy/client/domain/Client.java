package tn.driveeasy.client.domain;

import java.time.LocalDate;

public record Client(
        String id,
        String cin,
        String nom,
        String prenom,
        LocalDate dateNaissance,
        String email,
        String telephone,
        String adresse,
        String numeroPermis,
        LocalDate dateExpirationPermis,
        String categorieClient,
        LocalDate dateInscription,
        int locationsTerminees) {
}
