package tn.driveeasy.vehicule.api;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.driveeasy.vehicule.domain.Vehicule;
import tn.driveeasy.vehicule.service.VehiculeService;

@RestController
@RequestMapping("/vehicules")
public class VehiculeController {
    private final VehiculeService service;

    public VehiculeController(VehiculeService service) {
        this.service = service;
    }

    @GetMapping
    public List<Vehicule> findAll(@RequestParam(name = "categorie", required = false) String categorie,
                                  @RequestParam(name = "carburant", required = false) String carburant,
                                  @RequestParam(name = "statut", required = false) String statut,
                                  @RequestParam(name = "prixMax", required = false) BigDecimal prixMax) {
        return service.findAll(categorie, carburant, statut, prixMax);
    }

    @GetMapping("/disponibles")
    public List<Vehicule> available(@RequestParam(name = "dateDebut") LocalDate dateDebut,
                                    @RequestParam(name = "dateFin") LocalDate dateFin) {
        return service.available(dateDebut, dateFin);
    }

    @GetMapping("/{id}")
    public Vehicule findById(@PathVariable("id") String id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Vehicule create(@Valid @RequestBody VehiculeDtos.Upsert input) {
        return service.create(input);
    }

    @PutMapping("/{id}")
    public Vehicule update(@PathVariable("id") String id, @Valid @RequestBody VehiculeDtos.Upsert input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/statut")
    public Vehicule updateStatus(@PathVariable("id") String id, @Valid @RequestBody VehiculeDtos.Statut input) {
        return service.updateStatus(id, input.statut());
    }

    @PatchMapping("/{id}/kilometrage")
    public Vehicule updateMileage(@PathVariable("id") String id, @Valid @RequestBody VehiculeDtos.Kilometrage input) {
        return service.updateMileage(id, input.kilometrage());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") String id) {
        service.delete(id);
    }
}
