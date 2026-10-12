# 🚀 Système OCR de Factures - Architecture d'Intégration

## 📊 Diagramme d'Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React.js App<br/>Port 3000]
        B[Components]
        C[Services]
        D[State Management]
    end
    
    subgraph "API Layer"
        E[FastAPI<br/>Port 8000<br/>OCR Processing]
        F[Spring Boot<br/>Port 8080<br/>Auth + Persistence]
    end
    
    subgraph "Data Layer"
        G[MySQL Database<br/>Port 3306]
        H[File Storage<br/>Temporary Files]
    end
    
    subgraph "External Services"
        I[PaddleOCR<br/>Text Recognition]
        J[Ollama LLM<br/>Data Extraction]
    end
    
    A --> E
    A --> F
    E --> I
    E --> J
    E --> H
    F --> G
    B --> C
    C --> D
```

## 🔄 Flux de Données Détaillé

### 1. Authentification
```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant R as React
    participant S as Spring Boot
    participant DB as MySQL
    
    U->>R: Login (username/password)
    R->>S: POST /auth/login
    S->>DB: Vérifier credentials
    DB-->>S: User data
    S-->>R: JWT Token + User info
    R->>R: Stocker JWT dans localStorage
    R-->>U: Redirection vers Dashboard
```

### 2. Upload et Traitement OCR
```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant R as React
    participant F as FastAPI
    participant OCR as PaddleOCR
    participant LLM as Ollama
    participant FS as File System
    
    U->>R: Sélectionner fichier
    R->>R: Validation fichier
    R->>F: POST /process-invoice (FormData)
    F->>FS: Sauvegarder fichier temporaire
    F->>OCR: Traitement OCR
    OCR-->>F: Texte extrait
    F->>LLM: Analyse avec prompt structuré
    LLM-->>F: JSON structuré
    F->>FS: Nettoyer fichier temporaire
    F-->>R: Données extraites
    R-->>U: Affichage formulaire pré-rempli
```

### 3. Validation et Sauvegarde
```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant R as React
    participant S as Spring Boot
    participant DB as MySQL
    
    U->>R: Correction des données
    R->>R: Validation côté client
    R->>S: POST /api/invoices (JWT + Data)
    S->>S: Vérifier JWT
    S->>DB: INSERT INTO invoices
    DB-->>S: Invoice créée
    S-->>R: Confirmation
    R-->>U: Message de succès
```

## 🏗️ Structure des Services

### Frontend (React.js)
```
frontend/
├── app/
│   └── page.tsx                 # Point d'entrée
├── components/
│   ├── InvoiceUpload.tsx        # Upload + OCR
│   ├── InvoiceList.tsx          # Liste factures
│   ├── Login.tsx               # Authentification
│   ├── Register.tsx            # Inscription
│   └── Dashboard.tsx           # Tableau de bord
├── lib/
│   ├── authService.ts          # Gestion JWT
│   ├── apiClient.ts            # Client API
│   └── errorHandler.ts         # Gestion erreurs
└── components/ui/              # Composants UI
```

### Backend Spring Boot
```
projetStageOcr/
├── src/main/java/com/example/projetstageocr/
│   ├── controller/
│   │   ├── AuthController.java      # Login/Register
│   │   └── InvoiceController.java   # CRUD Factures
│   ├── entity/
│   │   ├── User.java               # Entité utilisateur
│   │   └── Invoice.java            # Entité facture
│   ├── service/
│   │   ├── AuthService.java        # Logique auth
│   │   └── InvoiceService.java     # Logique factures
│   ├── repository/
│   │   ├── UserRepository.java     # DAO utilisateur
│   │   └── InvoiceRepository.java   # DAO facture
│   ├── security/
│   │   ├── JwtService.java         # Gestion JWT
│   │   └── SecurityConfig.java     # Configuration sécurité
│   └── dto/
│       ├── AuthResponse.java       # Réponse auth
│       ├── InvoiceRequest.java     # Requête facture
│       └── InvoiceResponse.java    # Réponse facture
```

### API OCR (FastAPI)
```
FASTAPI/
├── app.py                        # API principale
├── paddletest.py                 # Logique OCR + LLM
└── requirements.txt              # Dépendances Python
```

## 🔐 Sécurité et Authentification

### JWT Flow
```mermaid
graph LR
    A[Login Request] --> B[Spring Boot]
    B --> C[Validate Credentials]
    C --> D[Generate JWT]
    D --> E[Return JWT + User Info]
    E --> F[Store in localStorage]
    F --> G[Add to API Headers]
    G --> H[Authenticated Requests]
```

### Configuration Sécurité
```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

## 📊 Modèles de Données

### Entité Invoice (Spring Boot)
```java
@Entity
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // Fournisseur
    private String supplierIce;
    private String supplierIf;
    private String supplierRc;
    private String supplierPatente;
    private String supplierCnss;
    private String supplierName;
    private String supplierAddress;
    
    // Client
    private String clientIce;
    private String clientName;
    
    // Facture
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private LocalDate deliveryDate;
    private BigDecimal amountHt;
    private BigDecimal amountTva;
    private Integer tvaRate;
    private BigDecimal amountTtc;
    
    // Métadonnées
    private String originalFilename;
    private String filePath;
    private Double ocrConfidence;
    private Boolean isValidated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Format OCR Response (FastAPI)
```json
{
  "fournisseur": {
    "ice": "string",
    "if": "string", 
    "raison_sociale": "string",
    "cnss": "string",
    "rc": "string",
    "patente": "string",
    "adresse": "string"
  },
  "client": {
    "ice": "string",
    "raison_sociale": "string"
  },
  "facture": {
    "numero_facture": "string",
    "date_facture": "YYYY-MM-DD",
    "date_echeance": "YYYY-MM-DD", 
    "date_livraison": "YYYY-MM-DD",
    "montant_ht": 0.0,
    "montant_tva": 0.0,
    "taux_tva": 0,
    "montant_ttc": 0.0
  }
}
```

## 🛡️ Gestion des Erreurs

### Types d'Erreurs
```typescript
export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class AppError extends Error {
  public status?: number
  public code?: string
  public details?: any
}
```

### Codes d'Erreur
- **400** : Validation des données
- **401** : Non authentifié
- **403** : Accès refusé
- **404** : Ressource non trouvée
- **413** : Fichier trop volumineux
- **415** : Type de fichier non supporté
- **500** : Erreur serveur

## 🚀 Déploiement

### Variables d'Environnement

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
NEXT_PUBLIC_SPRING_BOOT_URL=http://localhost:8080
```

#### Spring Boot (application.properties)
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/ocr_db
spring.datasource.username=root
spring.datasource.password=
app.jwt.secret=your-secret-key
app.jwt.expiration-ms=3600000
```

#### FastAPI (config.py)
```python
OCR_LANG = "fr"
MODEL = "llama3:latest"
OLLAMA_PATH = "path/to/ollama"
OUTPUT_DIR = "path/to/output"
```

### Commandes de Démarrage

```bash
# 1. Base de données
mysql -u root -p
CREATE DATABASE ocr_db;

# 2. Spring Boot
cd projetStageOcr/projetStageOcr
./mvnw spring-boot:run

# 3. FastAPI  
cd FASTAPI/FASTAPI
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# 4. React.js
cd frontend
npm install
npm run dev
```

## 📈 Monitoring et Logs

### Logs Spring Boot
```yaml
logging:
  level:
    com.example.projetstageocr: DEBUG
    org.springframework.security: DEBUG
  file:
    name: logs/application.log
```

### Logs FastAPI
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Métriques Utiles
- Nombre de factures traitées
- Taux de succès OCR
- Temps de traitement moyen
- Erreurs par type

## 🔧 Maintenance

### Tâches Régulières
- Nettoyage des fichiers temporaires
- Rotation des logs
- Sauvegarde de la base de données
- Mise à jour des dépendances

### Surveillance
- Monitoring des performances OCR
- Vérification de l'espace disque
- Contrôle de la mémoire
- Alertes sur les erreurs critiques

---

Cette architecture modulaire permet une **séparation claire des responsabilités**, une **scalabilité** et une **maintenabilité** optimales pour le système OCR de factures.
