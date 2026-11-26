package tn.driveeasy.location.client;

import java.time.LocalDate;
import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import tn.driveeasy.location.api.LocationDtos;

@FeignClient(name = "vehicule-service")
public interface VehicleClient {
    @GetMapping("/vehicules")
    List<LocationDtos.Vehicle> getVehicles();

    @GetMapping("/vehicules/{id}")
    LocationDtos.Vehicle getVehicle(@PathVariable("id") String id);

    @GetMapping("/vehicules/disponibles")
    List<LocationDtos.Vehicle> getAvailable(@RequestParam("dateDebut") LocalDate dateDebut,
                                            @RequestParam("dateFin") LocalDate dateFin);

    @PatchMapping("/vehicules/{id}/statut")
    LocationDtos.Vehicle updateStatus(@PathVariable("id") String id, @RequestBody LocationDtos.StatusUpdate input);

    @PatchMapping("/vehicules/{id}/kilometrage")
    LocationDtos.Vehicle updateMileage(@PathVariable("id") String id, @RequestBody LocationDtos.MileageUpdate input);
}
