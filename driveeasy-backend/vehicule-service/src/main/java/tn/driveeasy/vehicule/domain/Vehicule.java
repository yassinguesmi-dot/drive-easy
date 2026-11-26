package tn.driveeasy.vehicule.domain;

import java.math.BigDecimal;

public record Vehicule(
        String id,
        String immatriculation,
        String marque,
        String modele,
        int annee,
        String couleur,
        String carburant,
        String boite,
        int nbPlaces,
        int kilometrage,
        BigDecimal prixJournalier,
        String statut,
        String categorie,
        String imageUrl) {
}
