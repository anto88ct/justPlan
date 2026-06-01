# AirPlan — Backend Architecture Specification

> **Stack**: Spring Boot 3.x + MongoDB + Spring Security + OAuth2
> **Documento generato dall'analisi completa del frontend Angular 17**
> **Target**: Creazione backend REST API per la web app AirPlan (Business Plan SaaS con AI)

---

## Indice

1. [Overview del Progetto](#1-overview-del-progetto)
2. [Architettura Generale](#2-architettura-generale)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Struttura del Progetto (Package Layout)](#4-struttura-del-progetto)
5. [Data Model — MongoDB Collections](#5-data-model--mongodb-collections)
6. [Repository Pattern](#6-repository-pattern)
7. [Autenticazione e Autorizzazione](#7-autenticazione-e-autorizzazione)
8. [API Endpoints Completi](#8-api-endpoints-completi)
9. [AI Chatbot — Architettura e Ottimizzazione](#9-ai-chatbot--architettura-e-ottimizzazione)
10. [Sistema Email](#10-sistema-email)
11. [Formato Custom .bxp (Export/Import)](#11-formato-custom-bxp-exportimport)
12. [Sicurezza — Procedure Standard](#12-sicurezza--procedure-standard)
13. [Configurazione e Profili](#13-configurazione-e-profili)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment e CI/CD](#15-deployment-e-cicd)

---

## 1. Overview del Progetto

**AirPlan** è una SaaS web application per la creazione di Business Plan professionali assistiti da AI. Il frontend Angular 17 è già sviluppato e implementa:

- **Auth**: Login standard (email/password), Google OAuth, registrazione, forgot-password
- **Wizard 6-step**: Configurazione globale → Ricavi/Prodotti → Team HR → Costi OPEX → Investimenti CAPEX → Finanziamenti
- **Financial Engine**: Motore di calcolo P&L triennale, cash flow mensile, KPI, ammortamenti, prestiti
- **Dashboard**: KPI cards, grafico cash flow SVG, conto economico editabile inline
- **AI Chatbot (Copilot)**: Chat in tempo reale con LLM per scenari "What-If"
- **Report**: 6 grafici ApexCharts (Revenue bar, Cash flow area, Cost donut, Margin lines, Stacked costs, Radial margins)
- **Piani Salvati**: CRUD piani con load/delete/save
- **Export PDF**: via `window.print()` (da sostituire con generazione server-side)
- **Impostazioni**: Notifiche AI, autosave, formato valuta, dark mode

### Dati chiave dal frontend

| Aspetto | Dettaglio |
|---------|-----------|
| Framework FE | Angular 17.3 standalone components |
| Routing | `/login`, `/register`, `/forgot-password`, `/app` (layout principale) |
| State Management | Signals (`signal()`, `computed()`) nel `BusinessPlanService` |
| Charts | ApexCharts via `ng-apexcharts` |
| CSS | TailwindCSS 3.4 |
| Deploy FE | Vercel (`vercel.json` presente) |

---

## 2. Architettura Generale

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 17)                  │
│     Vercel / CDN — SPA con lazy-loaded components        │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / REST + WebSocket (AI chat)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 API GATEWAY / REVERSE PROXY               │
│              (Nginx / Spring Cloud Gateway)               │
└────────────────────────┬─────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────┐
│              SPRING BOOT APPLICATION                      │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  Auth    │  │ Business │  │    AI    │  │  Email   │ │
│  │ Module   │  │   Plan   │  │ Chatbot  │  │ Service  │ │
│  │         │  │  Module   │  │  Module  │  │         │ │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │            │             │              │       │
│  ┌────┴────────────┴─────────────┴──────────────┴────┐ │
│  │              SERVICE LAYER                         │ │
│  └────────────────────┬──────────────────────────────┘ │
│                       │                                 │
│  ┌────────────────────┴──────────────────────────────┐ │
│  │            REPOSITORY LAYER (Spring Data MongoDB)  │ │
│  └────────────────────┬──────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│                     MongoDB Atlas                         │
│  Collections: users, business_plans, chat_sessions,      │
│               email_logs, refresh_tokens, ai_cache       │
└──────────────────────────────────────────────────────────┘
                        ▲
                        │
┌──────────────────────────────────────────────────────────┐
│              SERVIZI ESTERNI                              │
│  • Google OAuth 2.0 API                                  │
│  • OpenAI / Anthropic API (LLM)                          │
│  • SMTP Server (SendGrid / AWS SES)                      │
│  • Redis (cache sessioni + rate limiting)                 │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Stack Tecnologico

| Componente | Tecnologia | Versione |
|-----------|------------|---------|
| Runtime | Java 21 (LTS) | 21+ |
| Framework | Spring Boot | 3.3.x |
| Database | MongoDB | 7.x |
| ODM | Spring Data MongoDB | 4.x |
| Security | Spring Security 6 + JWT | 6.x |
| OAuth2 | Spring Security OAuth2 Client | 6.x |
| Validation | Jakarta Validation (Hibernate Validator) | 3.x |
| Email | Spring Boot Mail + Thymeleaf templates | 3.x |
| AI Client | Spring AI / OpenAI Java SDK | latest |
| Cache | Spring Cache + Redis (Lettuce) | latest |
| API Docs | SpringDoc OpenAPI (Swagger UI) | 2.x |
| Build | Maven / Gradle | latest |
| Testing | JUnit 5 + Mockito + Testcontainers | latest |
| Logging | SLF4J + Logback (structured JSON) | latest |

### Dipendenze Maven principali

```xml
<dependencies>
    <!-- Core -->
    <dependency>spring-boot-starter-web</dependency>
    <dependency>spring-boot-starter-data-mongodb</dependency>
    <dependency>spring-boot-starter-security</dependency>
    <dependency>spring-boot-starter-validation</dependency>
    <dependency>spring-boot-starter-mail</dependency>
    <dependency>spring-boot-starter-cache</dependency>
    <dependency>spring-boot-starter-data-redis</dependency>
    <dependency>spring-boot-starter-websocket</dependency>
    <dependency>spring-boot-starter-thymeleaf</dependency>

    <!-- JWT -->
    <dependency>io.jsonwebtoken:jjwt-api:0.12.x</dependency>
    <dependency>io.jsonwebtoken:jjwt-impl:0.12.x</dependency>
    <dependency>io.jsonwebtoken:jjwt-jackson:0.12.x</dependency>

    <!-- OAuth2 -->
    <dependency>spring-boot-starter-oauth2-client</dependency>
    <dependency>spring-boot-starter-oauth2-resource-server</dependency>

    <!-- AI -->
    <dependency>spring-ai-openai-spring-boot-starter</dependency>

    <!-- Docs -->
    <dependency>springdoc-openapi-starter-webmvc-ui</dependency>

    <!-- PDF -->
    <dependency>com.openhtmltopdf:openhtmltopdf-pdfbox</dependency>

    <!-- Test -->
    <dependency>spring-boot-starter-test</dependency>
    <dependency>org.testcontainers:mongodb</dependency>
    <dependency>spring-security-test</dependency>
</dependencies>
```

---

## 4. Struttura del Progetto

```
src/main/java/com/airplan/
├── AirPlanApplication.java
│
├── config/
│   ├── SecurityConfig.java              # Spring Security filter chain
│   ├── CorsConfig.java                  # CORS per Angular frontend
│   ├── MongoConfig.java                 # MongoDB auditing, converters
│   ├── RedisConfig.java                 # Cache manager
│   ├── WebSocketConfig.java             # STOMP WebSocket per AI chat
│   ├── OpenApiConfig.java               # Swagger/OpenAPI metadata
│   ├── AiConfig.java                    # OpenAI client bean
│   └── MailConfig.java                  # Template engine per email
│
├── security/
│   ├── jwt/
│   │   ├── JwtTokenProvider.java        # Generazione/validazione JWT
│   │   ├── JwtAuthenticationFilter.java # OncePerRequestFilter
│   │   └── JwtProperties.java          # @ConfigurationProperties
│   ├── oauth2/
│   │   ├── OAuth2SuccessHandler.java    # Custom success handler Google
│   │   ├── OAuth2UserService.java       # Caricamento/creazione utente
│   │   └── OAuth2FailureHandler.java
│   ├── UserDetailsServiceImpl.java
│   ├── SecurityUtils.java              # Helper: get current user
│   └── RateLimitFilter.java            # Rate limiting per IP/user
│
├── domain/                              # Entità MongoDB (@Document)
│   ├── User.java
│   ├── BusinessPlan.java
│   ├── WizardInput.java                 # Embedded document
│   ├── FinancialOutput.java             # Embedded: KPI, Income, CashFlow
│   ├── ChatSession.java
│   ├── ChatMessage.java                 # Embedded in ChatSession
│   ├── RefreshToken.java
│   ├── PasswordResetToken.java
│   ├── EmailVerificationToken.java
│   └── AiScenarioCache.java
│
├── repository/                          # Spring Data MongoDB repositories
│   ├── UserRepository.java
│   ├── BusinessPlanRepository.java
│   ├── ChatSessionRepository.java
│   ├── RefreshTokenRepository.java
│   ├── PasswordResetTokenRepository.java
│   └── AiScenarioCacheRepository.java
│
├── service/                             # Business logic
│   ├── AuthService.java
│   ├── UserService.java
│   ├── BusinessPlanService.java
│   ├── FinancialEngineService.java      # Motore calcolo finanziario
│   ├── AiChatService.java              # Orchestratore AI + prompt engineering
│   ├── AiScenarioService.java          # Parsing risposta AI → mutazioni BP
│   ├── EmailService.java
│   ├── BxpExportService.java           # Export formato .bxp
│   ├── BxpImportService.java           # Import formato .bxp
│   ├── PdfReportService.java           # Generazione PDF server-side
│   └── TokenCleanupService.java        # @Scheduled pulizia token scaduti
│
├── controller/                          # REST controllers
│   ├── AuthController.java
│   ├── UserController.java
│   ├── BusinessPlanController.java
│   ├── AiChatController.java           # REST + WebSocket
│   ├── ExportController.java           # .bxp + PDF endpoints
│   └── HealthController.java
│
├── dto/                                 # Request/Response DTOs
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── ForgotPasswordRequest.java
│   │   ├── ResetPasswordRequest.java
│   │   ├── WizardInputRequest.java
│   │   ├── UpdateCellRequest.java
│   │   ├── AiChatRequest.java
│   │   └── SavePlanRequest.java
│   ├── response/
│   │   ├── AuthResponse.java           # JWT tokens + user info
│   │   ├── UserProfileResponse.java
│   │   ├── BusinessPlanResponse.java
│   │   ├── BusinessPlanSummaryResponse.java
│   │   ├── FinancialOutputResponse.java
│   │   ├── AiChatResponse.java
│   │   └── ApiErrorResponse.java
│   └── mapper/
│       ├── UserMapper.java
│       ├── BusinessPlanMapper.java
│       └── ChatMapper.java
│
├── exception/
│   ├── GlobalExceptionHandler.java      # @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── DuplicateEmailException.java
│   ├── InvalidTokenException.java
│   ├── AiServiceException.java
│   ├── BxpFormatException.java
│   └── RateLimitExceededException.java
│
├── validation/
│   ├── ValidPassword.java               # Custom annotation
│   ├── PasswordConstraintValidator.java
│   └── WizardInputValidator.java
│
└── util/
    ├── BxpSerializer.java               # Serializzazione formato .bxp
    ├── BxpDeserializer.java
    ├── FinancialCalculator.java          # Utility calcoli finanziari
    └── SlugGenerator.java

src/main/resources/
├── application.yml
├── application-dev.yml
├── application-prod.yml
├── templates/
│   └── email/
│       ├── welcome.html
│       ├── password-reset.html
│       ├── email-verification.html
│       └── plan-shared.html
└── static/
    └── email-assets/
        └── logo.png
```

---

## 5. Data Model — MongoDB Collections

### 5.1 `users`

```java
@Document(collection = "users")
@TypeAlias("User")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String name;
    private String password;            // BCrypt hash (null per OAuth2-only users)
    private boolean emailVerified;

    @Indexed
    private AuthProvider authProvider;   // LOCAL, GOOGLE
    private String googleId;            // null se provider = LOCAL
    private String avatarUrl;

    // Piano di abbonamento
    private SubscriptionPlan plan;      // FREE, STARTER, PRO
    private int plansCreated;
    private int aiQueriesUsedToday;

    // Preferenze
    private UserPreferences preferences;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
    private Instant lastLoginAt;
    private boolean active;
}

public enum AuthProvider { LOCAL, GOOGLE }

public enum SubscriptionPlan { FREE, STARTER, PRO }

@Data
public class UserPreferences {
    private boolean aiNotifications = true;
    private boolean autoSave = true;
    private boolean thousandsFormat = false;
    private boolean darkMode = false;
}
```

### 5.2 `business_plans`

```java
@Document(collection = "business_plans")
@TypeAlias("BusinessPlan")
public class BusinessPlan {
    @Id
    private String id;

    @Indexed
    private String userId;              // ref → users._id

    private String name;                // es. "TechHub Pro"
    private String slug;                // URL-friendly: "techhub-pro"

    // Input completo del wizard (per ricalcolo e .bxp export)
    private WizardInput wizardInput;

    // Output calcolato (per dashboard veloce senza ricalcolo)
    private FinancialOutput financialOutput;

    // Stato
    private PlanStatus status;          // DRAFT, GENERATED, ARCHIVED

    // Metadata
    private int version;                // per optimistic locking
    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    // AI modifications tracking
    private List<AiModification> aiModifications;
}

public enum PlanStatus { DRAFT, GENERATED, ARCHIVED }
```

### 5.3 `WizardInput` (Embedded Document)

Mappa **1:1** le interfacce TypeScript del frontend:

```java
@Data
public class WizardInput {
    private WizardConfig config;
    private List<WizardProduct> products;
    private List<WizardEmployee> employees;
    private WizardHrParams hrParams;
    private List<WizardVariableCost> variableCosts;
    private List<WizardFixedCost> fixedCosts;
    private List<WizardCapex> investments;
    private List<WizardEquity> equityInjections;
    private List<WizardLoan> loans;
}

@Data
public class WizardConfig {
    @NotBlank
    private String projectName;
    @Min(2024) @Max(2040)
    private int startYear;
    @DecimalMin("0") @DecimalMax("50")
    private double iresRate;            // default 24
    @DecimalMin("0") @DecimalMax("10")
    private double irapRate;            // default 4
    @DecimalMin("0") @DecimalMax("10")
    private double badDebtPct;          // default 0.1
    private boolean isNewStartup;
    @Min(0)
    private double initialCash;
    @Min(0)
    private double residualCredits;
    @Min(0)
    private double residualDebts;
}

@Data
public class WizardProduct {
    @NotBlank
    private String name;
    @Min(0)
    private double unitPrice;
    private VolumeMode volumeMode;      // LINEAR, MONTHLY
    private int linearStart;
    private double linearGrowthPct;
    private List<Integer> monthlyVolumes; // 12 elements
    private int collectionDelay;        // 0, 30, 60, 90 giorni
}

@Data
public class WizardEmployee {
    private String role;
    @Min(0)
    private double ral;
    @DecimalMin("0.1") @DecimalMax("5")
    private double fte;
    @Min(1) @Max(12)
    private int startMonth;
    private int startYear;
}

@Data
public class WizardHrParams {
    private double inpsPct;             // default 28.0
    private double inailPct;            // default 0.5
    private double tfrPct;              // default 7.41
    private int salaryMonths;           // 12, 13, 14
}

@Data
public class WizardVariableCost {
    private CostValueType valueType;    // PCT, ABS
    @Min(0)
    private double value;
    private int paymentDelay;           // 0, 30, 60, 90, 120
}

@Data
public class WizardFixedCost {
    private String category;            // affitti, spese_generali, marketing, commerciali
    @Min(0)
    private double monthlyBudget;
    private int paymentDelay;
}

@Data
public class WizardCapex {
    private String category;            // fabbricati, impianti, attrezzature, impianto, rnd
    @Min(0)
    private double cost;
    @Min(1) @Max(12)
    private int purchaseMonth;
    private int purchaseYear;
}

@Data
public class WizardEquity {
    @Min(0)
    private double amount;
    @Min(1) @Max(12)
    private int month;
    private int year;
}

@Data
public class WizardLoan {
    @Min(0)
    private double amount;
    @Min(1) @Max(12)
    private int month;
    private int year;
    @DecimalMin("0")
    private double interestRate;
    @Min(1)
    private int durationMonths;
    @Min(0)
    private int preAmortizationMonths;
    @Min(1) @Max(12)
    private int firstPaymentMonth;
    private int firstPaymentYear;
}
```

### 5.4 `FinancialOutput` (Embedded Document)

```java
@Data
public class FinancialOutput {
    private KpiData kpi;
    private List<CashFlowPoint> cashFlow;       // 12 punti (Y1 mensile)
    private List<IncomeRow> incomeStatement;     // righe P&L triennale

    @Data
    public static class KpiData {
        private double fatturatoTotale;
        private double ebitda;
        private double utileNetto;
        private int cashRunway;                 // mesi
    }

    @Data
    public static class CashFlowPoint {
        private String month;                   // "Gen", "Feb", ...
        private double value;
    }

    @Data
    public static class IncomeRow {
        private String label;                   // "Ricavi Totali", "EBITDA", ...
        private double anno1;
        private double anno2;
        private double anno3;
        private boolean isHighlight;
        private boolean isCost;
    }
}
```

### 5.5 `chat_sessions`

```java
@Document(collection = "chat_sessions")
public class ChatSession {
    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String businessPlanId;          // ref → business_plans._id

    private List<ChatMessage> messages;

    // Contesto condensato per evitare di inviare tutta la history all'AI
    private String condensedContext;
    private int totalTokensUsed;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;
}

@Data
public class ChatMessage {
    private ChatRole role;                  // USER, ASSISTANT, SYSTEM
    private String content;
    private Instant timestamp;
    private int tokensUsed;
    private AiModification appliedModification; // null se messaggio senza azione
}

@Data
public class AiModification {
    private String scenarioDescription;
    private Map<String, Object> paramChanges; // cosa è stato modificato
    private FinancialOutput.KpiData beforeKpi;
    private FinancialOutput.KpiData afterKpi;
}
```

### 5.6 `refresh_tokens`

```java
@Document(collection = "refresh_tokens")
public class RefreshToken {
    @Id
    private String id;
    @Indexed
    private String userId;
    @Indexed(unique = true)
    private String token;                   // UUID v4
    private String userAgent;
    private String ipAddress;
    private Instant expiresAt;
    @CreatedDate
    private Instant createdAt;
}
```

### 5.7 `password_reset_tokens`

```java
@Document(collection = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    private String id;
    @Indexed
    private String userId;
    @Indexed(unique = true)
    private String token;                   // SHA-256 hash del token inviato via email
    private Instant expiresAt;              // 30 minuti (come indicato nel FE)
    private boolean used;
    @CreatedDate
    private Instant createdAt;
}
```

### 5.8 `ai_scenario_cache`

```java
@Document(collection = "ai_scenario_cache")
public class AiScenarioCache {
    @Id
    private String id;
    private String promptHash;              // SHA-256(prompt normalizzato)
    private String contextHash;             // SHA-256(stato BP semplificato)
    private String response;
    private AiModification modification;
    private int hitCount;
    @Indexed(expireAfter = "7d")
    private Instant createdAt;              // TTL index: 7 giorni
}
```

### MongoDB Indexes da creare

```javascript
// users
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "googleId": 1 }, { sparse: true });

// business_plans
db.business_plans.createIndex({ "userId": 1, "createdAt": -1 });
db.business_plans.createIndex({ "userId": 1, "status": 1 });
db.business_plans.createIndex({ "userId": 1, "slug": 1 }, { unique: true });

// chat_sessions
db.chat_sessions.createIndex({ "userId": 1, "businessPlanId": 1 });

// refresh_tokens
db.refresh_tokens.createIndex({ "token": 1 }, { unique: true });
db.refresh_tokens.createIndex({ "userId": 1 });
db.refresh_tokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// password_reset_tokens
db.password_reset_tokens.createIndex({ "token": 1 }, { unique: true });
db.password_reset_tokens.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// ai_scenario_cache
db.ai_scenario_cache.createIndex({ "promptHash": 1, "contextHash": 1 });
db.ai_scenario_cache.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 604800 });
```

---

## 6. Repository Pattern

Implementare il **Repository Pattern** con Spring Data MongoDB. Ogni entità ha:

1. **Repository Interface** — estende `MongoRepository<T, String>`
2. **Custom Repository Interface** — per query complesse
3. **Custom Repository Implementation** — con `MongoTemplate`

### Esempio: BusinessPlanRepository

```java
// 1. Repository base
public interface BusinessPlanRepository
        extends MongoRepository<BusinessPlan, String>,
                BusinessPlanCustomRepository {

    List<BusinessPlan> findByUserIdOrderByCreatedAtDesc(String userId);

    Optional<BusinessPlan> findByIdAndUserId(String id, String userId);

    Optional<BusinessPlan> findByUserIdAndSlug(String userId, String slug);

    long countByUserId(String userId);

    void deleteByIdAndUserId(String id, String userId);

    List<BusinessPlan> findByUserIdAndStatus(String userId, PlanStatus status);
}

// 2. Custom repository interface
public interface BusinessPlanCustomRepository {
    List<BusinessPlanSummaryProjection> findSummariesByUserId(String userId);
    boolean updateFinancialOutput(String planId, String userId, FinancialOutput output);
    boolean updateSingleCell(String planId, String userId,
                             String rowLabel, String yearField, double value);
}

// 3. Custom implementation
@Repository
@RequiredArgsConstructor
public class BusinessPlanCustomRepositoryImpl implements BusinessPlanCustomRepository {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<BusinessPlanSummaryProjection> findSummariesByUserId(String userId) {
        Query query = Query.query(Criteria.where("userId").is(userId))
            .with(Sort.by(Sort.Direction.DESC, "createdAt"));
        query.fields()
            .include("name", "slug", "status", "createdAt", "updatedAt")
            .include("financialOutput.kpi");
        return mongoTemplate.find(query, BusinessPlanSummaryProjection.class, "business_plans");
    }

    @Override
    public boolean updateFinancialOutput(String planId, String userId, FinancialOutput output) {
        Query query = Query.query(
            Criteria.where("_id").is(planId).and("userId").is(userId)
        );
        Update update = new Update()
            .set("financialOutput", output)
            .set("updatedAt", Instant.now())
            .inc("version", 1);
        UpdateResult result = mongoTemplate.updateFirst(query, update, BusinessPlan.class);
        return result.getModifiedCount() > 0;
    }

    @Override
    public boolean updateSingleCell(String planId, String userId,
                                     String rowLabel, String yearField, double value) {
        // Uso dell'array filter per aggiornare una riga specifica dell'income statement
        Query query = Query.query(
            Criteria.where("_id").is(planId)
                .and("userId").is(userId)
                .and("financialOutput.incomeStatement.label").is(rowLabel)
        );
        Update update = new Update()
            .set("financialOutput.incomeStatement.$." + yearField, value)
            .set("updatedAt", Instant.now());
        UpdateResult result = mongoTemplate.updateFirst(query, update, BusinessPlan.class);
        return result.getModifiedCount() > 0;
    }
}
```

### Esempio: UserRepository

```java
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByGoogleId(String googleId);

    boolean existsByEmail(String email);

    @Query(value = "{ '_id': ?0 }", fields = "{ 'password': 0 }")
    Optional<User> findByIdWithoutPassword(String id);
}
```

### Pattern di servizio con Repository

```java
@Service
@RequiredArgsConstructor
@Transactional
public class BusinessPlanServiceImpl implements BusinessPlanService {

    private final BusinessPlanRepository businessPlanRepository;
    private final FinancialEngineService financialEngine;
    private final UserRepository userRepository;

    @Override
    public BusinessPlanResponse createFromWizard(String userId, WizardInputRequest request) {
        // 1. Validazione limiti utente
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        validatePlanLimit(user);

        // 2. Calcolo finanziario server-side
        WizardInput input = BusinessPlanMapper.toWizardInput(request);
        FinancialOutput output = financialEngine.compute(input);

        // 3. Persistenza
        BusinessPlan plan = BusinessPlan.builder()
            .userId(userId)
            .name(request.getConfig().getProjectName())
            .slug(SlugGenerator.generate(request.getConfig().getProjectName()))
            .wizardInput(input)
            .financialOutput(output)
            .status(PlanStatus.GENERATED)
            .build();

        plan = businessPlanRepository.save(plan);

        // 4. Aggiorna contatore utente
        user.setPlansCreated(user.getPlansCreated() + 1);
        userRepository.save(user);

        return BusinessPlanMapper.toResponse(plan);
    }
}
```

---

## 7. Autenticazione e Autorizzazione

### 7.1 Flow di Autenticazione — Login Standard

```
Client                     Server                        MongoDB
  │                          │                              │
  │  POST /api/auth/login    │                              │
  │  {email, password}       │                              │
  │ ─────────────────────►   │                              │
  │                          │  findByEmail(email)          │
  │                          │ ────────────────────────────►│
  │                          │  user                        │
  │                          │ ◄────────────────────────────│
  │                          │                              │
  │                          │  BCrypt.matches(pw, hash)    │
  │                          │  generateAccessToken(user)   │
  │                          │  generateRefreshToken(user)  │
  │                          │  save refreshToken           │
  │                          │ ────────────────────────────►│
  │                          │                              │
  │  200 OK                  │                              │
  │  {accessToken,           │                              │
  │   refreshToken,          │                              │
  │   user}                  │                              │
  │ ◄─────────────────────   │                              │
```

### 7.2 Flow di Autenticazione — Google OAuth

```
Client                     Server                     Google APIs
  │                          │                             │
  │  GET /oauth2/authorize/  │                             │
  │      google              │                             │
  │ ─────────────────────►   │                             │
  │                          │  redirect → Google consent  │
  │ ◄─────────────────────   │                             │
  │                          │                             │
  │  [User authorizes]       │                             │
  │ ──────────────────────────────────────────────────────►│
  │                          │                             │
  │  GET /api/auth/oauth2/   │  exchange code → tokens     │
  │      callback/google     │ ───────────────────────────►│
  │      ?code=xxx           │  user profile               │
  │ ─────────────────────►   │ ◄───────────────────────────│
  │                          │                             │
  │                          │  findOrCreate user (email,  │
  │                          │  googleId, name, avatar)    │
  │                          │  generate JWT tokens        │
  │                          │                             │
  │  302 redirect →          │                             │
  │  FE_URL?token=xxx        │                             │
  │ ◄─────────────────────   │                             │
```

### 7.3 Configurazione Spring Security

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final OAuth2UserService oAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(UNAUTHORIZED))
            )
            .authorizeHttpRequests(auth -> auth
                // Pubbliche
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/oauth2/**").permitAll()

                // Protette
                .requestMatchers("/api/plans/**").authenticated()
                .requestMatchers("/api/ai/**").authenticated()
                .requestMatchers("/api/user/**").authenticated()
                .requestMatchers("/api/export/**").authenticated()

                // Admin
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(ui -> ui.userService(oAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:4200",          // Angular dev
            "https://airplan.vercel.app"      // Produzione
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

### 7.4 JWT Token Provider

```java
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    // Access Token: breve durata (15 min)
    public String generateAccessToken(User user) {
        return Jwts.builder()
            .subject(user.getId())
            .claim("email", user.getEmail())
            .claim("name", user.getName())
            .claim("plan", user.getPlan().name())
            .issuedAt(new Date())
            .expiration(Date.from(Instant.now().plus(15, ChronoUnit.MINUTES)))
            .signWith(getSigningKey(), Jwts.SIG.HS512)
            .compact();
    }

    // Refresh Token: lunga durata (7 giorni)
    public RefreshToken generateRefreshToken(User user, String userAgent, String ip) {
        return RefreshToken.builder()
            .userId(user.getId())
            .token(UUID.randomUUID().toString())
            .userAgent(userAgent)
            .ipAddress(ip)
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .build();
    }

    public String getUserIdFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(
            Decoders.BASE64.decode(jwtProperties.getSecret())
        );
    }
}
```

### 7.5 Password Policy

Dal frontend si evince il password strength meter con i seguenti criteri:

```java
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordConstraintValidator.class)
public @interface ValidPassword {
    String message() default "Password non valida";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

    @Override
    public boolean isValid(String password, ConstraintValidatorContext ctx) {
        if (password == null) return false;

        List<String> errors = new ArrayList<>();

        if (password.length() < 8)
            errors.add("Minimo 8 caratteri");
        if (!password.matches(".*[A-Z].*"))
            errors.add("Almeno una lettera maiuscola");
        if (!password.matches(".*[0-9].*"))
            errors.add("Almeno un numero");
        if (!password.matches(".*[^A-Za-z0-9].*"))
            errors.add("Almeno un carattere speciale");

        if (!errors.isEmpty()) {
            ctx.disableDefaultConstraintViolation();
            ctx.buildConstraintViolationWithTemplate(String.join(", ", errors))
               .addConstraintViolation();
            return false;
        }
        return true;
    }
}
```

---

## 8. API Endpoints Completi

### 8.1 Auth (`/api/auth`)

| Metodo | Path | Descrizione | Auth | Request Body | Response |
|--------|------|-------------|------|-------------|----------|
| `POST` | `/api/auth/register` | Registrazione utente | ❌ | `RegisterRequest` | `AuthResponse` |
| `POST` | `/api/auth/login` | Login email/password | ❌ | `LoginRequest` | `AuthResponse` |
| `POST` | `/api/auth/refresh` | Rinnova access token | ❌ | `{ refreshToken }` | `AuthResponse` |
| `POST` | `/api/auth/logout` | Invalida refresh token | ✅ | `{ refreshToken }` | `204` |
| `POST` | `/api/auth/forgot-password` | Invia email di recupero | ❌ | `{ email }` | `200 { message }` |
| `POST` | `/api/auth/reset-password` | Reimposta password | ❌ | `{ token, newPassword }` | `200 { message }` |
| `POST` | `/api/auth/verify-email` | Verifica email | ❌ | `{ token }` | `200 { message }` |
| `GET` | `/api/auth/oauth2/google` | Redirect a Google consent | ❌ | — | `302 redirect` |
| `GET` | `/api/auth/oauth2/callback/google` | Callback Google OAuth | ❌ | query params | `302 → FE + token` |

#### Request/Response DTOs

```java
// Register
public record RegisterRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @ValidPassword String password,
    @NotBlank String confirmPassword
) {}

// Login
public record LoginRequest(
    @Email @NotBlank String email,
    @NotBlank String password,
    boolean rememberMe
) {}

// Auth Response
public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresIn,         // secondi
    UserProfileResponse user
) {}

// Forgot Password
public record ForgotPasswordRequest(
    @Email @NotBlank String email
) {}

// Reset Password
public record ResetPasswordRequest(
    @NotBlank String token,
    @ValidPassword String newPassword
) {}
```

### 8.2 User (`/api/user`)

| Metodo | Path | Descrizione | Auth |
|--------|------|-------------|------|
| `GET` | `/api/user/profile` | Profilo utente corrente | ✅ |
| `PUT` | `/api/user/profile` | Aggiorna profilo | ✅ |
| `PUT` | `/api/user/preferences` | Aggiorna preferenze | ✅ |
| `PUT` | `/api/user/password` | Cambia password | ✅ |
| `DELETE` | `/api/user/account` | Elimina account (soft delete) | ✅ |

### 8.3 Business Plan (`/api/plans`)

| Metodo | Path | Descrizione | Auth | Note |
|--------|------|-------------|------|------|
| `POST` | `/api/plans` | Crea piano da wizard input | ✅ | Esegue il financial engine server-side |
| `GET` | `/api/plans` | Lista piani dell'utente | ✅ | Ritorna solo summary (no full data) |
| `GET` | `/api/plans/:id` | Dettaglio piano completo | ✅ | Include wizard input + financial output |
| `PUT` | `/api/plans/:id` | Aggiorna wizard input + ricalcola | ✅ | Riesegue il financial engine |
| `PATCH` | `/api/plans/:id/cell` | Modifica singola cella income statement | ✅ | Ricalcola righe calcolate |
| `PATCH` | `/api/plans/:id/name` | Rinomina piano | ✅ | |
| `DELETE` | `/api/plans/:id` | Elimina piano | ✅ | |
| `POST` | `/api/plans/:id/duplicate` | Duplica piano | ✅ | |

#### Request/Response DTOs dettagliati

```java
// Wizard Input Request (POST /api/plans)
// Corrisponde 1:1 all'interfaccia WizardInput del frontend
public record WizardInputRequest(
    @Valid @NotNull WizardConfigRequest config,
    @Valid @NotEmpty List<WizardProductRequest> products,
    @Valid @NotEmpty List<WizardEmployeeRequest> employees,
    @Valid @NotNull WizardHrParamsRequest hrParams,
    @Valid List<WizardVariableCostRequest> variableCosts,
    @Valid List<WizardFixedCostRequest> fixedCosts,
    @Valid List<WizardCapexRequest> investments,
    @Valid List<WizardEquityRequest> equityInjections,
    @Valid List<WizardLoanRequest> loans
) {}

// Cell Update Request (PATCH /api/plans/:id/cell)
public record UpdateCellRequest(
    @NotBlank String rowLabel,      // es. "Ricavi Totali"
    @NotBlank String yearField,     // "anno1", "anno2", "anno3"
    double value
) {}

// Plan Summary Response (GET /api/plans — lista)
public record BusinessPlanSummaryResponse(
    String id,
    String name,
    String slug,
    PlanStatus status,
    FinancialOutput.KpiData kpi,
    Instant createdAt,
    Instant updatedAt
) {}

// Full Plan Response (GET /api/plans/:id)
public record BusinessPlanResponse(
    String id,
    String name,
    String slug,
    PlanStatus status,
    WizardInput wizardInput,
    FinancialOutputResponse financialOutput,
    List<AiModification> aiModifications,
    int version,
    Instant createdAt,
    Instant updatedAt
) {}
```

### 8.4 AI Chatbot (`/api/ai`)

| Metodo | Path | Descrizione | Auth | Note |
|--------|------|-------------|------|------|
| `POST` | `/api/ai/chat` | Invia messaggio al chatbot | ✅ | Sincrono, con streaming opzionale |
| `POST` | `/api/ai/chat/stream` | Chat con SSE streaming | ✅ | Server-Sent Events |
| `GET` | `/api/ai/sessions` | Lista sessioni chat | ✅ | |
| `GET` | `/api/ai/sessions/:id` | Storico messaggi sessione | ✅ | |
| `DELETE` | `/api/ai/sessions/:id` | Elimina sessione chat | ✅ | |
| `POST` | `/api/ai/scenario/apply` | Applica scenario AI al piano | ✅ | Persiste le modifiche |
| `POST` | `/api/ai/scenario/reset` | Reset a valori pre-AI | ✅ | |

```java
// Chat Request
public record AiChatRequest(
    @NotBlank String message,
    @NotBlank String businessPlanId,
    String sessionId                // null = nuova sessione
) {}

// Chat Response
public record AiChatResponse(
    String sessionId,
    String reply,
    AiModification modification,    // null se il messaggio è informativo
    FinancialOutputResponse updatedFinancials // null se nessuna modifica
) {}
```

### 8.5 Export/Import (`/api/export`)

| Metodo | Path | Descrizione | Auth | Content-Type |
|--------|------|-------------|------|-------------|
| `GET` | `/api/export/plans/:id/bxp` | Export piano in formato .bxp | ✅ | `application/octet-stream` |
| `POST` | `/api/export/plans/import/bxp` | Import piano da file .bxp | ✅ | `multipart/form-data` |
| `GET` | `/api/export/plans/:id/pdf` | Export report PDF | ✅ | `application/pdf` |

### 8.6 Health (`/api/health`)

| Metodo | Path | Descrizione | Auth |
|--------|------|-------------|------|
| `GET` | `/api/health` | Health check | ❌ |
| `GET` | `/api/health/ready` | Readiness (DB + Redis) | ❌ |

---

## 9. AI Chatbot — Architettura e Ottimizzazione

### 9.1 Architettura del flusso AI

```
┌─────────┐    POST /api/ai/chat     ┌──────────────┐
│ Angular  │ ──────────────────────── │ AiChatCtrl   │
│ Frontend │                          └──────┬───────┘
└─────────┘                                  │
                                             ▼
                                    ┌────────────────┐
                                    │ AiChatService  │
                                    │                │
                                    │  1. Load BP    │
                                    │  2. Build ctx  │
                                    │  3. Check cache│
                                    │  4. Call LLM   │
                                    │  5. Parse resp │
                                    │  6. Apply mods │
                                    │  7. Save state │
                                    └───────┬────────┘
                                            │
                        ┌───────────────────┼────────────────────┐
                        ▼                   ▼                    ▼
               ┌────────────┐    ┌──────────────────┐  ┌────────────────┐
               │ Redis Cache │    │ OpenAI / Claude  │  │ MongoDB        │
               │ (scenario   │    │ API              │  │ (save session, │
               │  cache)     │    │ (gpt-4o-mini)    │  │  update plan)  │
               └─────────────┘    └──────────────────┘  └────────────────┘
```

### 9.2 Strategia di Ottimizzazione API Calls

#### A. Context Compression (ridurre token in input)

```java
@Service
public class AiContextBuilder {

    /**
     * Costruisce un contesto compresso del business plan
     * per ridurre il numero di token inviati all'LLM.
     * Invece di inviare l'intero WizardInput + FinancialOutput,
     * inviamo un riassunto strutturato.
     */
    public String buildCompressedContext(BusinessPlan plan) {
        FinancialOutput fo = plan.getFinancialOutput();
        WizardInput wi = plan.getWizardInput();

        StringBuilder ctx = new StringBuilder();
        ctx.append("## Business Plan: ").append(plan.getName()).append("\n");
        ctx.append("Anno avvio: ").append(wi.getConfig().getStartYear()).append("\n\n");

        // KPI sintetici
        ctx.append("### KPI Anno 1\n");
        ctx.append("- Fatturato: €").append(formatK(fo.getKpi().getFatturatoTotale())).append("\n");
        ctx.append("- EBITDA: €").append(formatK(fo.getKpi().getEbitda())).append("\n");
        ctx.append("- Utile Netto: €").append(formatK(fo.getKpi().getUtileNetto())).append("\n");
        ctx.append("- Cash Runway: ").append(fo.getKpi().getCashRunway()).append(" mesi\n\n");

        // P&L triennale compresso
        ctx.append("### Conto Economico (Anno1 / Anno2 / Anno3)\n");
        for (FinancialOutput.IncomeRow row : fo.getIncomeStatement()) {
            ctx.append("- ").append(row.getLabel()).append(": ")
               .append(formatK(row.getAnno1())).append(" / ")
               .append(formatK(row.getAnno2())).append(" / ")
               .append(formatK(row.getAnno3())).append("\n");
        }

        // Prodotti (solo nomi e prezzi)
        ctx.append("\n### Prodotti\n");
        for (WizardProduct p : wi.getProducts()) {
            ctx.append("- ").append(p.getName()).append(": €").append(p.getUnitPrice()).append("/u\n");
        }

        // Team (numero persone, costo totale)
        ctx.append("\n### Team: ").append(wi.getEmployees().size()).append(" persone\n");

        return ctx.toString();
    }
}
```

#### B. Semantic Cache (evitare chiamate duplicate)

```java
@Service
@RequiredArgsConstructor
public class AiCacheService {

    private final AiScenarioCacheRepository cacheRepository;

    /**
     * Cache semantica: se una domanda simile è già stata posta
     * su uno stato BP simile, ritorna la risposta cached.
     */
    public Optional<AiScenarioCache> findCachedResponse(String prompt, BusinessPlan plan) {
        String promptHash = hash(normalizePrompt(prompt));
        String contextHash = hash(buildContextFingerprint(plan));

        return cacheRepository.findByPromptHashAndContextHash(promptHash, contextHash)
            .map(cache -> {
                cache.setHitCount(cache.getHitCount() + 1);
                cacheRepository.save(cache);
                return cache;
            });
    }

    private String normalizePrompt(String prompt) {
        // Rimuovi punteggiatura, lowercase, rimuovi stopwords italiane
        return prompt.toLowerCase()
            .replaceAll("[^a-zàèìòù0-9 ]", "")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String buildContextFingerprint(BusinessPlan plan) {
        // Hash basato solo sui KPI principali (non tutto il piano)
        var kpi = plan.getFinancialOutput().getKpi();
        return kpi.getFatturatoTotale() + "|" +
               kpi.getEbitda() + "|" +
               kpi.getUtileNetto() + "|" +
               kpi.getCashRunway();
    }
}
```

#### C. Conversation Summarization (ridurre contesto storico)

```java
/**
 * Ogni 5 messaggi, condensare la conversazione precedente
 * in un singolo messaggio di sistema per ridurre i token.
 */
public String condensePreviousMessages(List<ChatMessage> messages) {
    if (messages.size() <= 6) {
        // Invia tutta la conversazione
        return null;
    }

    // Prendi gli ultimi 4 messaggi + un riassunto dei precedenti
    List<ChatMessage> old = messages.subList(0, messages.size() - 4);

    StringBuilder summary = new StringBuilder();
    summary.append("[Riassunto conversazione precedente]\n");
    for (ChatMessage msg : old) {
        if (msg.getRole() == ChatRole.USER) {
            summary.append("User ha chiesto: ").append(truncate(msg.getContent(), 80)).append("\n");
        } else if (msg.getRole() == ChatRole.ASSISTANT && msg.getAppliedModification() != null) {
            summary.append("AI ha applicato: ").append(
                msg.getAppliedModification().getScenarioDescription()
            ).append("\n");
        }
    }
    return summary.toString();
}
```

#### D. Model Routing (scegliere il modello giusto)

```java
/**
 * Routing intelligente del modello AI:
 * - Domande semplici (info/formato) → gpt-4o-mini (economico, veloce)
 * - Scenari What-If → gpt-4o (più accurato per calcoli)
 * - Analisi complesse → claude-3.5-sonnet
 */
public String selectModel(String userMessage) {
    String lower = userMessage.toLowerCase();

    // Pattern per domande di scenario
    boolean isScenario = lower.contains("cosa succede se") ||
                         lower.contains("simula") ||
                         lower.contains("quanto") ||
                         lower.contains("se alzo") ||
                         lower.contains("se riduc") ||
                         lower.contains("proiezione");

    if (isScenario) {
        return "gpt-4o";  // o "claude-3.5-sonnet"
    }

    return "gpt-4o-mini";  // Domande informative → modello economico
}
```

#### E. Rate Limiting AI per utente

```java
@Service
@RequiredArgsConstructor
public class AiRateLimiter {

    private final UserRepository userRepository;

    private static final Map<SubscriptionPlan, Integer> DAILY_LIMITS = Map.of(
        SubscriptionPlan.FREE, 10,
        SubscriptionPlan.STARTER, 50,
        SubscriptionPlan.PRO, 500
    );

    public void checkAndIncrement(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        int limit = DAILY_LIMITS.getOrDefault(user.getPlan(), 10);

        if (user.getAiQueriesUsedToday() >= limit) {
            throw new RateLimitExceededException(
                "Limite giornaliero AI raggiunto (" + limit + " query). " +
                "Effettua l'upgrade per aumentare il limite."
            );
        }

        user.setAiQueriesUsedToday(user.getAiQueriesUsedToday() + 1);
        userRepository.save(user);
    }
}
```

### 9.3 System Prompt per il CFO Virtuale

```java
public static final String SYSTEM_PROMPT = """
    Sei il CFO Virtuale di AirPlan, un assistente AI specializzato in business planning.

    ## Ruolo
    - Sei un esperto di finanza aziendale italiana (IRES, IRAP, contributi INPS, TFR)
    - Parli italiano, in modo professionale ma accessibile
    - Rispondi sempre con dati concreti e numeri quando possibile

    ## Capacità
    1. **Analisi What-If**: Quando l'utente chiede "cosa succede se...", calcola le variazioni
       e restituisci i nuovi KPI con le differenze percentuali
    2. **Consigli finanziari**: Suggerisci ottimizzazioni basate sui dati del piano
    3. **Spiegazioni**: Spiega metriche finanziarie in modo semplice

    ## Formato risposta per scenari
    Quando applichi uno scenario, rispondi SEMPRE in questo formato JSON wrappato:

    ```json
    {
      "type": "scenario",
      "description": "Breve descrizione dello scenario",
      "modifications": {
        "revenueMultiplier": 1.18,
        "costReductionPct": 0,
        "additionalEmployees": 0,
        "priceChange": { "productName": "Piano SaaS", "newPrice": 59 }
      },
      "narrative": "Testo discorsivo da mostrare all'utente con emoji e formattazione"
    }
    ```

    Se la domanda è informativa (non uno scenario), rispondi con:
    ```json
    {
      "type": "info",
      "narrative": "Risposta discorsiva"
    }
    ```

    ## Contesto del Business Plan attuale
    {{BUSINESS_PLAN_CONTEXT}}

    ## Storico conversazione
    {{CONVERSATION_SUMMARY}}
    """;
```

---

## 10. Sistema Email

### 10.1 Tipologie di Email

| Email | Trigger | Template | Scadenza Token |
|-------|---------|----------|---------------|
| **Benvenuto** | Registrazione | `welcome.html` | — |
| **Verifica Email** | Registrazione | `email-verification.html` | 24h |
| **Reset Password** | Forgot password | `password-reset.html` | 30 min (dal FE) |
| **Piano Condiviso** | (futuro) Share BP | `plan-shared.html` | — |

### 10.2 Implementazione Email Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;    // Thymeleaf

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendWelcomeEmail(User user) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("appUrl", frontendUrl);

        sendHtmlEmail(
            user.getEmail(),
            "Benvenuto su AirPlan! 🚀",
            "welcome",
            ctx
        );
    }

    @Async
    public void sendPasswordResetEmail(User user, String rawToken) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("resetLink", frontendUrl + "/reset-password?token=" + rawToken);
        ctx.setVariable("expirationMinutes", 30);

        sendHtmlEmail(
            user.getEmail(),
            "Reimposta la tua password — AirPlan",
            "password-reset",
            ctx
        );
    }

    @Async
    public void sendEmailVerification(User user, String rawToken) {
        Context ctx = new Context();
        ctx.setVariable("userName", user.getName());
        ctx.setVariable("verifyLink", frontendUrl + "/verify-email?token=" + rawToken);

        sendHtmlEmail(
            user.getEmail(),
            "Conferma il tuo indirizzo email — AirPlan",
            "email-verification",
            ctx
        );
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context ctx) {
        try {
            String htmlBody = templateEngine.process("email/" + templateName, ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, "AirPlan");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            // Inline logo
            helper.addInline("logo", new ClassPathResource("static/email-assets/logo.png"));

            mailSender.send(message);
            log.info("Email '{}' inviata a {}", subject, to);
        } catch (Exception e) {
            log.error("Errore invio email a {}: {}", to, e.getMessage(), e);
            // Non rilanciare: l'email è best-effort, non deve bloccare il flusso
        }
    }
}
```

### 10.3 Configurazione SMTP

```yaml
# application.yml
spring:
  mail:
    host: ${SMTP_HOST:smtp.sendgrid.net}
    port: ${SMTP_PORT:587}
    username: ${SMTP_USERNAME:apikey}
    password: ${SMTP_PASSWORD}
    properties:
      mail.smtp.auth: true
      mail.smtp.starttls.enable: true
      mail.smtp.starttls.required: true
      mail.smtp.connectiontimeout: 5000
      mail.smtp.timeout: 5000
      mail.smtp.writetimeout: 5000

app:
  mail:
    from: "noreply@airplan.io"
  frontend-url: ${FRONTEND_URL:http://localhost:4200}
```

### 10.4 Template Email Thymeleaf (esempio password-reset.html)

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
</head>
<body style="margin:0; padding:0; background:#f4f4f5; font-family:'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="480" cellpadding="0" cellspacing="0"
                       style="background:white; border-radius:16px; overflow:hidden;
                              box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#7c3aed);
                                   padding:32px; text-align:center;">
                            <img th:src="'cid:logo'" alt="AirPlan" width="120"/>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <h2 style="color:#18181b; margin:0 0 16px;">
                                Ciao <span th:text="${userName}">Utente</span>,
                            </h2>
                            <p style="color:#71717a; line-height:1.6;">
                                Hai richiesto il reset della password. Clicca il pulsante
                                qui sotto per reimpostarla.
                            </p>
                            <div style="text-align:center; margin:24px 0;">
                                <a th:href="${resetLink}"
                                   style="display:inline-block; padding:14px 32px;
                                          background:linear-gradient(135deg,#6366f1,#7c3aed);
                                          color:white; text-decoration:none; border-radius:12px;
                                          font-weight:600; font-size:14px;">
                                    Reimposta Password
                                </a>
                            </div>
                            <p style="color:#a1a1aa; font-size:13px;">
                                Il link scade dopo <strong th:text="${expirationMinutes}">30</strong> minuti.
                                Se non hai richiesto tu il reset, ignora questa email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding:16px 32px; background:#fafafa; border-top:1px solid #f4f4f5;
                                   text-align:center;">
                            <p style="color:#a1a1aa; font-size:11px; margin:0;">
                                © 2025 AirPlan · Il tuo Business Plan, senza limiti.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 11. Formato Custom .bxp (Export/Import)

### 11.1 Specifiche del Formato

Il formato `.bxp` (**Business Plan Exchange**) è un formato custom proprietario di AirPlan per esportare e importare business plan completi. Caratteristiche:

- **Estensione**: `.bxp`
- **Struttura**: ZIP contenente JSON + metadata
- **Firmato**: HMAC-SHA256 per integrità
- **Versionato**: compatibilità backward

### 11.2 Struttura Interna del File .bxp

```
myplan.bxp (ZIP archive)
├── manifest.json          # Metadata e versione formato
├── wizard-input.json      # Dati input del wizard
├── financial-output.json  # Output finanziario calcolato
├── ai-history.json        # (opzionale) Storico modifiche AI
└── signature.sig          # HMAC-SHA256 per integrità
```

### 11.3 manifest.json

```json
{
    "formatVersion": "1.0.0",
    "appVersion": "1.0.0",
    "generator": "AirPlan Backend v1.0",
    "exportedAt": "2025-06-01T15:30:00Z",
    "planName": "TechHub Pro",
    "planId": "plan-abc123",
    "checksum": "sha256:abc123...",
    "author": {
        "name": "Mario Rossi",
        "email": "mario@startup.it"
    },
    "contents": [
        "wizard-input.json",
        "financial-output.json",
        "ai-history.json"
    ]
}
```

### 11.4 Implementazione Export

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class BxpExportService {

    private final ObjectMapper objectMapper;

    @Value("${app.bxp.signing-key}")
    private String signingKey;

    public byte[] exportPlan(BusinessPlan plan, User user) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            // 1. Wizard Input
            byte[] wizardJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(plan.getWizardInput());
            addZipEntry(zos, "wizard-input.json", wizardJson);

            // 2. Financial Output
            byte[] financialJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(plan.getFinancialOutput());
            addZipEntry(zos, "financial-output.json", financialJson);

            // 3. AI History (opzionale)
            if (plan.getAiModifications() != null && !plan.getAiModifications().isEmpty()) {
                byte[] aiJson = objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsBytes(plan.getAiModifications());
                addZipEntry(zos, "ai-history.json", aiJson);
            }

            // 4. Manifest
            BxpManifest manifest = BxpManifest.builder()
                .formatVersion("1.0.0")
                .appVersion("1.0.0")
                .generator("AirPlan Backend v1.0")
                .exportedAt(Instant.now())
                .planName(plan.getName())
                .planId(plan.getId())
                .checksum(computeChecksum(wizardJson, financialJson))
                .author(new BxpManifest.Author(user.getName(), user.getEmail()))
                .build();

            byte[] manifestJson = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsBytes(manifest);
            addZipEntry(zos, "manifest.json", manifestJson);

            // 5. Firma HMAC
            String signature = computeHmac(manifestJson, wizardJson, financialJson);
            addZipEntry(zos, "signature.sig", signature.getBytes(StandardCharsets.UTF_8));
        }

        return baos.toByteArray();
    }

    private String computeHmac(byte[]... dataArrays) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                signingKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(keySpec);

            for (byte[] data : dataArrays) {
                mac.update(data);
            }

            return HexFormat.of().formatHex(mac.doFinal());
        } catch (Exception e) {
            throw new RuntimeException("Errore nel calcolo HMAC", e);
        }
    }

    private void addZipEntry(ZipOutputStream zos, String name, byte[] data)
            throws IOException {
        zos.putNextEntry(new ZipEntry(name));
        zos.write(data);
        zos.closeEntry();
    }
}
```

### 11.5 Implementazione Import

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class BxpImportService {

    private final ObjectMapper objectMapper;
    private final FinancialEngineService financialEngine;
    private final BusinessPlanRepository planRepository;

    @Value("${app.bxp.signing-key}")
    private String signingKey;

    public BusinessPlan importPlan(byte[] bxpFileBytes, String userId) throws IOException {

        Map<String, byte[]> entries = readZipEntries(bxpFileBytes);

        // 1. Verifica che manifest esista
        byte[] manifestBytes = entries.get("manifest.json");
        if (manifestBytes == null) {
            throw new BxpFormatException("File .bxp invalido: manifest.json mancante");
        }

        BxpManifest manifest = objectMapper.readValue(manifestBytes, BxpManifest.class);

        // 2. Verifica versione formato
        if (!isVersionCompatible(manifest.getFormatVersion())) {
            throw new BxpFormatException(
                "Versione formato non supportata: " + manifest.getFormatVersion()
            );
        }

        // 3. Verifica firma HMAC
        byte[] signatureBytes = entries.get("signature.sig");
        if (signatureBytes != null) {
            verifySignature(entries, new String(signatureBytes, StandardCharsets.UTF_8));
        }

        // 4. Parse wizard input
        byte[] wizardBytes = entries.get("wizard-input.json");
        if (wizardBytes == null) {
            throw new BxpFormatException("File .bxp invalido: wizard-input.json mancante");
        }
        WizardInput wizardInput = objectMapper.readValue(wizardBytes, WizardInput.class);

        // 5. Ricalcolo server-side (non fidarsi dell'output importato)
        FinancialOutput recalculated = financialEngine.compute(wizardInput);

        // 6. Crea nuovo piano
        BusinessPlan plan = BusinessPlan.builder()
            .userId(userId)
            .name(manifest.getPlanName() + " (Importato)")
            .slug(SlugGenerator.generate(manifest.getPlanName() + "-import"))
            .wizardInput(wizardInput)
            .financialOutput(recalculated)
            .status(PlanStatus.GENERATED)
            .build();

        return planRepository.save(plan);
    }

    private void verifySignature(Map<String, byte[]> entries, String expectedSig) {
        // Ricalcola HMAC e verifica
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                signingKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"
            );
            mac.init(keySpec);

            mac.update(entries.getOrDefault("manifest.json", new byte[0]));
            mac.update(entries.getOrDefault("wizard-input.json", new byte[0]));
            mac.update(entries.getOrDefault("financial-output.json", new byte[0]));

            String computed = HexFormat.of().formatHex(mac.doFinal());

            if (!MessageDigest.isEqual(
                    computed.getBytes(StandardCharsets.UTF_8),
                    expectedSig.getBytes(StandardCharsets.UTF_8))) {
                throw new BxpFormatException(
                    "Firma HMAC non valida. Il file potrebbe essere stato alterato."
                );
            }
        } catch (BxpFormatException e) {
            throw e;
        } catch (Exception e) {
            throw new BxpFormatException("Errore nella verifica della firma", e);
        }
    }
}
```

### 11.6 REST Controller per Export/Import

```java
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final BxpExportService bxpExportService;
    private final BxpImportService bxpImportService;
    private final PdfReportService pdfReportService;
    private final BusinessPlanRepository planRepository;
    private final SecurityUtils securityUtils;

    @GetMapping("/plans/{planId}/bxp")
    public ResponseEntity<byte[]> exportBxp(@PathVariable String planId) {
        String userId = securityUtils.getCurrentUserId();
        BusinessPlan plan = planRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Plan", planId));
        User user = securityUtils.getCurrentUser();

        byte[] bxpData = bxpExportService.exportPlan(plan, user);

        String filename = plan.getSlug() + ".bxp";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + filename + "\"")
            .body(bxpData);
    }

    @PostMapping("/plans/import/bxp")
    public ResponseEntity<BusinessPlanResponse> importBxp(
            @RequestParam("file") MultipartFile file) throws IOException {

        // Validazione
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File vuoto");
        }
        if (!file.getOriginalFilename().endsWith(".bxp")) {
            throw new BxpFormatException("Il file deve avere estensione .bxp");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB max
            throw new IllegalArgumentException("File troppo grande (max 10MB)");
        }

        String userId = securityUtils.getCurrentUserId();
        BusinessPlan imported = bxpImportService.importPlan(file.getBytes(), userId);

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BusinessPlanMapper.toResponse(imported));
    }

    @GetMapping("/plans/{planId}/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable String planId) {
        String userId = securityUtils.getCurrentUserId();
        BusinessPlan plan = planRepository.findByIdAndUserId(planId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Plan", planId));

        byte[] pdfData = pdfReportService.generateReport(plan);

        String filename = plan.getSlug() + "-report.pdf";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + filename + "\"")
            .body(pdfData);
    }
}
```

---

## 12. Sicurezza — Procedure Standard

### 12.1 Checklist Sicurezza Completa

| # | Misura | Implementazione |
|---|--------|----------------|
| 1 | **Password Hashing** | BCrypt con cost factor 12 |
| 2 | **JWT Sicuro** | HS512, access token 15min, refresh 7gg |
| 3 | **CSRF Protection** | Disabilitato (API stateless + CORS), ma SameSite cookies |
| 4 | **CORS** | Whitelist origin espliciti (no wildcard) |
| 5 | **Rate Limiting** | Per IP (globale) + per utente (AI endpoints) |
| 6 | **Input Validation** | Jakarta Validation su tutti i DTO |
| 7 | **SQL/NoSQL Injection** | Spring Data parametrized queries |
| 8 | **XSS** | Content-Type: application/json, escape HTML in email |
| 9 | **HTTPS** | Forzato in produzione |
| 10 | **Headers Sicurezza** | X-Content-Type-Options, X-Frame-Options, CSP, HSTS |
| 11 | **Secrets Management** | ENV vars, mai in codice |
| 12 | **Audit Logging** | Log su login, cambio password, operazioni sensibili |
| 13 | **Account Lockout** | 5 tentativi falliti → lock 15 minuti |
| 14 | **Token Rotation** | Refresh token rotation (uso singolo) |
| 15 | **Data Isolation** | Ogni query filtra per userId |
| 16 | **File Upload** | Validazione tipo, dimensione, estensione |
| 17 | **Dependency Scanning** | OWASP Dependency Check / Snyk |
| 18 | **Error Handling** | Mai esporre stack trace in produzione |

### 12.2 Security Headers

```java
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy",
            "camera=(), microphone=(), geolocation=()");
        response.setHeader("Strict-Transport-Security",
            "max-age=31536000; includeSubDomains; preload");
        response.setHeader("Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

        chain.doFilter(request, response);
    }
}
```

### 12.3 Rate Limiting

```java
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, String> redisTemplate;

    // Limiti per endpoint pattern
    private static final Map<String, RateLimit> RATE_LIMITS = Map.of(
        "/api/auth/login",           new RateLimit(5, Duration.ofMinutes(15)),
        "/api/auth/register",        new RateLimit(3, Duration.ofHours(1)),
        "/api/auth/forgot-password", new RateLimit(3, Duration.ofHours(1)),
        "/api/ai/chat",              new RateLimit(30, Duration.ofMinutes(1))
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = getClientIp(request);

        for (Map.Entry<String, RateLimit> entry : RATE_LIMITS.entrySet()) {
            if (path.startsWith(entry.getKey())) {
                RateLimit limit = entry.getValue();
                String key = "rate:" + path + ":" + ip;

                Long count = redisTemplate.opsForValue().increment(key);
                if (count == 1) {
                    redisTemplate.expire(key, limit.window());
                }

                if (count > limit.maxRequests()) {
                    response.setStatus(429);
                    response.setContentType("application/json");
                    response.getWriter().write(
                        """
                        {"error": "Too Many Requests",
                         "message": "Troppi tentativi. Riprova tra qualche minuto.",
                         "retryAfter": %d}
                        """.formatted(limit.window().getSeconds())
                    );
                    return;
                }

                response.setHeader("X-RateLimit-Limit", String.valueOf(limit.maxRequests()));
                response.setHeader("X-RateLimit-Remaining",
                    String.valueOf(Math.max(0, limit.maxRequests() - count)));
                break;
            }
        }

        chain.doFilter(request, response);
    }

    record RateLimit(int maxRequests, Duration window) {}
}
```

### 12.4 Account Lockout

```java
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final RedisTemplate<String, String> redisTemplate;

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    public void recordFailedAttempt(String email) {
        String key = "login_attempts:" + email.toLowerCase();
        Long attempts = redisTemplate.opsForValue().increment(key);
        if (attempts == 1) {
            redisTemplate.expire(key, LOCK_DURATION);
        }
    }

    public void resetAttempts(String email) {
        redisTemplate.delete("login_attempts:" + email.toLowerCase());
    }

    public boolean isAccountLocked(String email) {
        String key = "login_attempts:" + email.toLowerCase();
        String val = redisTemplate.opsForValue().get(key);
        return val != null && Integer.parseInt(val) >= MAX_ATTEMPTS;
    }

    public int getRemainingAttempts(String email) {
        String key = "login_attempts:" + email.toLowerCase();
        String val = redisTemplate.opsForValue().get(key);
        int used = val != null ? Integer.parseInt(val) : 0;
        return Math.max(0, MAX_ATTEMPTS - used);
    }
}
```

### 12.5 Refresh Token Rotation

```java
/**
 * Implementa refresh token rotation:
 * ogni volta che un refresh token viene usato, ne viene generato uno nuovo
 * e il vecchio viene invalidato.
 * Se un token già usato viene presentato, invalida TUTTI i token dell'utente
 * (possibile token theft).
 */
@Transactional
public AuthResponse refreshAccessToken(String oldRefreshToken, String userAgent, String ip) {
    RefreshToken stored = refreshTokenRepository.findByToken(oldRefreshToken)
        .orElseThrow(() -> {
            // Token non trovato: possibile replay attack
            log.warn("Refresh token non trovato: possibile replay attack");
            return new InvalidTokenException("Refresh token non valido");
        });

    // Verifica scadenza
    if (stored.getExpiresAt().isBefore(Instant.now())) {
        refreshTokenRepository.delete(stored);
        throw new InvalidTokenException("Refresh token scaduto");
    }

    // Invalida il vecchio token
    refreshTokenRepository.delete(stored);

    // Genera nuovi token
    User user = userRepository.findById(stored.getUserId())
        .orElseThrow(() -> new ResourceNotFoundException("User", stored.getUserId()));

    String newAccessToken = jwtTokenProvider.generateAccessToken(user);
    RefreshToken newRefreshToken = jwtTokenProvider.generateRefreshToken(user, userAgent, ip);
    refreshTokenRepository.save(newRefreshToken);

    return new AuthResponse(newAccessToken, newRefreshToken.getToken(),
                            900, UserMapper.toResponse(user));
}
```

### 12.6 Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(
            new ApiErrorResponse(404, "NOT_FOUND", ex.getMessage())
        );
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateEmailException ex) {
        return ResponseEntity.status(409).body(
            new ApiErrorResponse(409, "CONFLICT", ex.getMessage())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return ResponseEntity.status(400).body(
            new ApiErrorResponse(400, "VALIDATION_ERROR", "Errori di validazione", errors)
        );
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleRateLimit(RateLimitExceededException ex) {
        return ResponseEntity.status(429).body(
            new ApiErrorResponse(429, "RATE_LIMIT", ex.getMessage())
        );
    }

    @ExceptionHandler(BxpFormatException.class)
    public ResponseEntity<ApiErrorResponse> handleBxpError(BxpFormatException ex) {
        return ResponseEntity.status(422).body(
            new ApiErrorResponse(422, "INVALID_BXP", ex.getMessage())
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex) {
        log.error("Errore non gestito", ex);
        // MAI esporre il messaggio reale in produzione
        return ResponseEntity.status(500).body(
            new ApiErrorResponse(500, "INTERNAL_ERROR",
                "Si è verificato un errore. Riprova più tardi.")
        );
    }
}

public record ApiErrorResponse(
    int status,
    String code,
    String message,
    List<String> details,
    Instant timestamp
) {
    public ApiErrorResponse(int status, String code, String message) {
        this(status, code, message, null, Instant.now());
    }
    public ApiErrorResponse(int status, String code, String message, List<String> details) {
        this(status, code, message, details, Instant.now());
    }
}
```

---

## 13. Configurazione e Profili

### application.yml (base)

```yaml
spring:
  application:
    name: airplan-api

  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/airplan}
      auto-index-creation: true

  jackson:
    serialization:
      WRITE_DATES_AS_TIMESTAMPS: false
    default-property-inclusion: NON_NULL

  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 15MB

server:
  port: ${PORT:8080}
  error:
    include-message: never
    include-stacktrace: never

# JWT
app:
  jwt:
    secret: ${JWT_SECRET}
    access-token-expiration-ms: 900000      # 15 min
    refresh-token-expiration-ms: 604800000  # 7 giorni

  # OAuth2 Google
  oauth2:
    google:
      client-id: ${GOOGLE_CLIENT_ID}
      client-secret: ${GOOGLE_CLIENT_SECRET}
      redirect-uri: ${GOOGLE_REDIRECT_URI}

  # AI
  ai:
    provider: openai                         # openai | anthropic
    api-key: ${AI_API_KEY}
    default-model: gpt-4o-mini
    scenario-model: gpt-4o
    max-tokens: 1024
    temperature: 0.7

  # BXP
  bxp:
    signing-key: ${BXP_SIGNING_KEY}

  frontend-url: ${FRONTEND_URL:http://localhost:4200}

# Logging
logging:
  level:
    com.airplan: DEBUG
    org.springframework.security: INFO
    org.springframework.data.mongodb: DEBUG
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

### application-prod.yml

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}

  cache:
    type: redis
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD}

server:
  error:
    include-message: never
    include-stacktrace: never

logging:
  level:
    com.airplan: INFO
    org.springframework.data.mongodb: WARN
  pattern:
    console: '{"time":"%d","level":"%level","logger":"%logger","msg":"%msg"}%n'
```

---

## 14. Testing Strategy

### 14.1 Piramide dei Test

| Livello | Tool | Coverage Target | Cosa testa |
|---------|------|----------------|------------|
| **Unit** | JUnit 5 + Mockito | 80%+ | Service, calcoli finanziari, serializer .bxp |
| **Integration** | Testcontainers (MongoDB) | 70%+ | Repository, auth flow, API endpoints |
| **Contract** | Spring Cloud Contract | — | Contratto FE ↔ BE |
| **E2E** | (FE-side) | — | Flussi completi |

### 14.2 Esempio Test — Financial Engine

```java
@ExtendWith(MockitoExtension.class)
class FinancialEngineServiceTest {

    private FinancialEngineService engine = new FinancialEngineService();

    @Test
    @DisplayName("Calcolo ricavi con crescita lineare")
    void shouldComputeLinearRevenue() {
        WizardInput input = buildMinimalInput();
        input.getProducts().get(0).setVolumeMode(VolumeMode.LINEAR);
        input.getProducts().get(0).setLinearStart(100);
        input.getProducts().get(0).setLinearGrowthPct(5);
        input.getProducts().get(0).setUnitPrice(10);

        FinancialOutput result = engine.compute(input);

        assertThat(result.getKpi().getFatturatoTotale()).isGreaterThan(12000);
        assertThat(result.getIncomeStatement()).isNotEmpty();
        assertThat(result.getCashFlow()).hasSize(12);
    }

    @Test
    @DisplayName("Cash runway con startup senza equity = 0 mesi")
    void shouldComputeZeroRunwayWithoutFunding() {
        WizardInput input = buildMinimalInput();
        input.getConfig().setIsNewStartup(true);
        input.getEquityInjections().clear();

        FinancialOutput result = engine.compute(input);

        assertThat(result.getKpi().getCashRunway()).isEqualTo(0);
    }
}
```

### 14.3 Esempio Test — Repository con Testcontainers

```java
@DataMongoTest
@Testcontainers
class BusinessPlanRepositoryTest {

    @Container
    static MongoDBContainer mongo = new MongoDBContainer("mongo:7");

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", mongo::getReplicaSetUrl);
    }

    @Autowired
    private BusinessPlanRepository repository;

    @Test
    @DisplayName("Trova piani per userId ordinati per data")
    void shouldFindByUserIdOrderedByDate() {
        // given
        repository.saveAll(List.of(
            buildPlan("user1", "Plan A", Instant.now().minus(1, ChronoUnit.DAYS)),
            buildPlan("user1", "Plan B", Instant.now()),
            buildPlan("user2", "Plan C", Instant.now())
        ));

        // when
        List<BusinessPlan> plans = repository
            .findByUserIdOrderByCreatedAtDesc("user1");

        // then
        assertThat(plans).hasSize(2);
        assertThat(plans.get(0).getName()).isEqualTo("Plan B");
    }
}
```

---

## 15. Deployment e CI/CD

### 15.1 Struttura Docker

```dockerfile
# Dockerfile (multi-stage)
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/airplan-api-*.jar app.jar

# Security: non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 15.2 Docker Compose (dev)

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - MONGODB_URI=mongodb://mongo:27017/airplan
      - REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
      - AI_API_KEY=${AI_API_KEY}
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongo-express:
    image: mongo-express
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_URL=mongodb://mongo:27017

volumes:
  mongo-data:
```

### 15.3 CI/CD Pipeline (GitHub Actions)

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7
        ports: [27017:27017]
      redis:
        image: redis:7-alpine
        ports: [6379:6379]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run tests
        run: ./mvnw verify
        env:
          MONGODB_URI: mongodb://localhost:27017/airplan-test
          REDIS_HOST: localhost

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build & Push Docker Image
        run: |
          docker build -t airplan-api:${{ github.sha }} .
          # Push to registry (ECR/GCR/Docker Hub)
```

---

## Riepilogo Mapping Frontend → Backend

| Feature Frontend | Endpoint Backend | Note |
|-----------------|-----------------|------|
| Login form (email/pw) | `POST /api/auth/login` | JWT access + refresh token |
| Google OAuth button | `GET /api/auth/oauth2/google` | Redirect flow |
| Register form | `POST /api/auth/register` | + email verifica |
| Forgot password | `POST /api/auth/forgot-password` | Token 30min, email |
| Wizard 6-step → genera piano | `POST /api/plans` | Financial engine server-side |
| Dashboard KPI + charts | `GET /api/plans/:id` | Dati precalcolati |
| Conto economico edit cella | `PATCH /api/plans/:id/cell` | Ricalcolo righe calcolate |
| Salva Business Plan | `POST /api/plans` (se nuovo) | Auto-generato |
| Carica Piano salvato | `GET /api/plans/:id` | Full data |
| Lista piani salvati | `GET /api/plans` | Solo summary + KPI |
| Elimina piano | `DELETE /api/plans/:id` | Soft delete opzionale |
| AI Chatbot messaggio | `POST /api/ai/chat` | Con caching semantico |
| AI applica scenario | `POST /api/ai/scenario/apply` | Persiste modifiche |
| AI reset scenario | `POST /api/ai/scenario/reset` | Ripristina da base |
| Export PDF | `GET /api/export/plans/:id/pdf` | Server-side rendering |
| Export .bxp | `GET /api/export/plans/:id/bxp` | Formato custom |
| Import .bxp | `POST /api/export/plans/import/bxp` | + ricalcolo |
| Impostazioni utente | `PUT /api/user/preferences` | Persistite in MongoDB |

---

> **Nota**: Questo documento è stato generato analizzando il codice sorgente completo del frontend Angular 17 di AirPlan, inclusi tutti i componenti, servizi, interfacce TypeScript, routing e logica di business. Ogni endpoint, modello dati e flusso è stato derivato dalle necessità reali del frontend esistente.
