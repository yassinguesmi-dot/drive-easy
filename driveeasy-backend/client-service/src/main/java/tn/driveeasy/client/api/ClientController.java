package tn.driveeasy.client.api;

import jakarta.validation.Valid;
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
import tn.driveeasy.client.domain.Client;
import tn.driveeasy.client.service.ClientService;

@RestController
@RequestMapping("/clients")
public class ClientController {
    private final ClientService service;

    public ClientController(ClientService service) { this.service = service; }

    @GetMapping
    public List<Client> findAll(@RequestParam(name = "q", required = false) String q) { return service.findAll(q); }

    @GetMapping("/{id}")
    public Client findById(@PathVariable("id") String id) { return service.findById(id); }

    @GetMapping("/{id}/eligibilite")
    public ClientDtos.Eligibility eligibility(@PathVariable("id") String id) { return service.eligibility(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Client create(@Valid @RequestBody ClientDtos.Upsert input) { return service.create(input); }

    @PutMapping("/{id}")
    public Client update(@PathVariable("id") String id, @Valid @RequestBody ClientDtos.Upsert input) {
        return service.update(id, input);
    }

    @PatchMapping("/{id}/categorie")
    public Client updateCategory(@PathVariable("id") String id, @Valid @RequestBody ClientDtos.Categorie input) {
        return service.updateCategory(id, input.categorie());
    }

    @PatchMapping("/{id}/location-active")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void setLocationActive(@PathVariable("id") String id, @Valid @RequestBody ClientDtos.ActiveLocation input) {
        service.setLocationActive(id, input.locationId(), input.active());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") String id) { service.delete(id); }
}
