package tn.driveeasy.location.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import tn.driveeasy.location.api.LocationDtos;

@FeignClient(name = "client-service")
public interface ClientClient {
    @GetMapping("/clients/{id}")
    LocationDtos.Client getClient(@PathVariable("id") String id);

    @GetMapping("/clients/{id}/eligibilite")
    LocationDtos.Eligibility getEligibility(@PathVariable("id") String id);

    @PatchMapping("/clients/{id}/categorie")
    LocationDtos.Client updateCategory(@PathVariable("id") String id, @RequestBody LocationDtos.CategoryUpdate input);

    @PatchMapping("/clients/{id}/location-active")
    void setLocationActive(@PathVariable("id") String id, @RequestBody LocationDtos.ActiveLocation input);
}
