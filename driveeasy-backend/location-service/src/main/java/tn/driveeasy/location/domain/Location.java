package tn.driveeasy.location.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record Location(
        String id,
        String clientId,
        String vehiculeId,
        LocalDate dateDebut,
        LocalDate dateFinPrevue,
        LocalDate dateRetourEffectif,
        Integer kmDepart,
        Integer kmRetour,
        BigDecimal prixJournalierApplique,
        BigDecimal montantTotal,
        BigDecimal penalite,
        StatutLocation statut,
        LocalDateTime dateCreation) {
    public enum StatutLocation { RESERVEE, EN_COURS, TERMINEE, ANNULEE }
}
