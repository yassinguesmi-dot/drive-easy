package tn.driveeasy.location.api;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.driveeasy.location.domain.Location;
import tn.driveeasy.location.domain.Location.StatutLocation;
import tn.driveeasy.location.service.LocationService;

@RestController
@RequestMapping("/locations")
public class LocationController {
    private final LocationService service;

    public LocationController(LocationService service) { this.service = service; }

    @GetMapping
    public LocationDtos.PageResult<Location> findAll(@RequestParam(name = "statut", required = false) StatutLocation statut,
                                  @RequestParam(name = "clientId", required = false) String clientId,
                                  @RequestParam(name = "vehiculeId", required = false) String vehiculeId,
                                  @RequestParam(name = "dateDebut", required = false) LocalDate dateDebut,
                                  @RequestParam(name = "dateFin", required = false) LocalDate dateFin,
                                  @RequestParam(name = "page", defaultValue = "0") int page,
                                  @RequestParam(name = "size", defaultValue = "10") int size) {
        return service.findAll(statut, clientId, vehiculeId, dateDebut, dateFin, page, size);
    }

    @GetMapping("/{id}")
    public LocationDtos.Detail detail(@PathVariable("id") String id) { return service.detail(id); }

    @GetMapping("/vehicules-disponibles")
    public List<LocationDtos.Vehicle> availableVehicles(@RequestParam(name = "dateDebut") LocalDate dateDebut,
                                                        @RequestParam(name = "dateFin") LocalDate dateFin) {
        return service.availableVehicles(dateDebut, dateFin);
    }

    @PostMapping("/simulation")
    public LocationDtos.Simulation simulate(@Valid @RequestBody LocationDtos.Reservation request) {
        return service.simulate(request);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Location reserve(@Valid @RequestBody LocationDtos.Reservation request) {
        return service.reserve(request);
    }

    @PatchMapping("/{id}/depart")
    public Location start(@PathVariable("id") String id, @Valid @RequestBody LocationDtos.Depart request) {
        return service.start(id, request.kmDepart());
    }

    @PatchMapping("/{id}/retour")
    public Location finish(@PathVariable("id") String id, @Valid @RequestBody LocationDtos.Retour request) {
        return service.finish(id, request.kmRetour(), request.dateRetourEffectif());
    }

    @PatchMapping("/{id}/annulation")
    public Location cancel(@PathVariable("id") String id) { return service.cancel(id); }

    @GetMapping("/statistiques")
    public LocationDtos.Statistics statistics() { return service.statistics(); }
}
