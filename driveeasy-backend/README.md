# DriveEasy Backend

Prototype de plateforme de location automobile en Java 21, Spring Boot 3.4 et Spring Cloud. Les trois services métier conservent leurs données en mémoire (aucune base de données). L'API Gateway est l'unique point d'entrée HTTP destiné au frontend.

## Architecture et ports

| Composant | Port | Rôle |
|---|---:|---|
| Eureka `service-registry` | 8761 | Découverte des services |
| Spring Cloud `config-server` | 8888 | Configuration Git externalisée |
| `vehicule-service` | 8081 | Parc automobile |
| `client-service` | 8082 | Clients et éligibilité |
| `location-service` | 8083 | Réservations et orchestration Feign |
| `api-gateway` | 8080 | CORS, routage `lb://`, journalisation |
| Zipkin | 9411 | Traces distribuées |

Spring Boot Actuator expose `/actuator/health` et `/actuator/info`; l'échantillonnage de traces vaut `1.0` en développement.

## Prérequis

- JDK 21 (variable `JAVA_HOME` configurée)
- Maven 3.9+
- Docker Desktop avec Compose
- Git

Sur une machine Windows vierge, installer un JDK 21 (par exemple [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=21)), Maven ([guide officiel](https://maven.apache.org/install.html)) et [Docker Desktop](https://www.docker.com/products/docker-desktop/). Configurer `JAVA_HOME` et ajouter `%JAVA_HOME%\bin` ainsi que le dossier `bin` de Maven au `PATH`, puis ouvrir une nouvelle fenêtre PowerShell. Vérifier les prérequis :

```powershell
java -version
mvn -version
git --version
docker version
docker compose version
```

## Installation et démarrage

Depuis `driveeasy-backend`, dans PowerShell :

```powershell
.\scripts\init-config-repo.cmd
docker compose up -d
```

Pour démarrer uniquement Zipkin, utiliser `docker compose up -d zipkin`; son interface est disponible sur http://localhost:9411.

Le dépôt local `config-repo` est initialisé une seule fois par le script Windows. Pour utiliser un dépôt distant, définir `CONFIG_REPO_URI` avec son URL Git et configurer les identifiants Git selon l'environnement.

Démarrer les applications dans cet ordre, chacune dans un terminal séparé :

```powershell
Set-Location .\service-registry
mvn spring-boot:run
```

```powershell
Set-Location .\config-server
mvn spring-boot:run
```

```powershell
Set-Location .\vehicule-service
mvn spring-boot:run
```

```powershell
Set-Location .\client-service
mvn spring-boot:run
```

```powershell
Set-Location .\location-service
mvn spring-boot:run
```

```powershell
Set-Location .\api-gateway
mvn spring-boot:run
```

Lancer ensuite le frontend. Le Config Server sert les fichiers `config-repo/{nom-du-service}.yml`; les microservices échouent explicitement au démarrage si le serveur de configuration n'est pas joignable.

## Vérification rapide

- Eureka : http://localhost:8761
- Zipkin : http://localhost:9411
- Santé : http://localhost:8080/actuator/health (et ports 8081, 8082, 8083, 8761, 8888)
- Catalogue : `GET http://localhost:8080/api/vehicules`
- Clients : `GET http://localhost:8080/api/clients`
- Locations paginées : `GET http://localhost:8080/api/locations?page=0&size=10`
- Simulation : `POST http://localhost:8080/api/locations/simulation`

## Tests

Depuis `driveeasy-backend`, exécuter les tests du service Location avec :

```powershell
mvn -pl location-service -am test
```

Le test couvre le filtrage des véhicules dont la période demandée chevauche une réservation existante.

Exemple de réservation :

```json
{
  "clientId": "client-demo-1",
  "vehiculeId": "vehicule-demo-1",
  "dateDebut": "2026-12-01",
  "dateFinPrevue": "2026-12-04"
}
```

La réponse de création est `201`; les validations renvoient `400`, les conflits `409`, les ressources absentes `404` et les erreurs internes `500`. Les données de démonstration sont recréées à chaque redémarrage : quatre véhicules (Toyota Yaris, Hyundai Tucson, Renault Clio et Kia Sportage), quatre clients éligibles et quatre locations terminées. Les dates des locations sont calculées par rapport au jour du démarrage; aucune réservation active ne bloque le parc.

## API métier

- Véhicules : `/api/vehicules` (filtres `categorie`, `carburant`, `statut`, `prixMax`), `/disponibles?dateDebut=...&dateFin=...`, `PATCH /{id}/statut`.
- Clients : `/api/clients?q=...`, `/{id}/eligibilite`, `PATCH /{id}/categorie`.
- Locations : `/api/locations`, `/vehicules-disponibles?dateDebut=...&dateFin=...`, `/simulation`, `/{id}/depart`, `/{id}/retour`, `/{id}/annulation`, `/statistiques`.
- Le service Location valide l'éligibilité et la disponibilité par Feign. Au retour, il libère le véhicule et compense les mises à jour distantes si une étape échoue.
- La recherche de véhicules disponibles par période exclut également les réservations existantes, y compris celles qui n'ont pas encore commencé.

Les registres et réservations sont propres au processus : un redémarrage efface les données. Le contrôle de chevauchement des réservations est local au `location-service`; ce prototype en mémoire ne fournit pas de verrou distribué entre plusieurs instances.

## Documentation et captures

Le rapport est fourni dans [`docs/rapport.md`](./docs/rapport.md). Les captures attendues (Eureka, appels API, traces Zipkin) sont marquées dans le rapport; elles restent à réaliser depuis une exécution locale.
