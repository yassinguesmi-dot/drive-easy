package tn.driveeasy.client.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ClientRepositoryTest {
    @Test
    void seedsFourDemoClientsWithCompletedRentalCounts() {
        ClientRepository repository = new ClientRepository();

        assertThat(repository.findAll()).hasSize(4)
                .allSatisfy(client -> assertThat(client.locationsTerminees()).isEqualTo(1));
    }
}
