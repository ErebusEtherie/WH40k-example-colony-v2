# Colony Sheet — analiza prototypu Excela

## 1. Cel dokumentu

Ten dokument opisuje aktualną logikę zawartą w skoroszycie:

`[WH40k_RT] [Team RT6] Colony Sheet.xlsx`

Skoroszyt jest jednocześnie:

- makietą interfejsu aplikacji,
- modelem danych,
- tabelą reguł,
- częściową implementacją silnika obliczeniowego.

**Ważne:** Excel należy traktować jako aktualny prototyp/reference implementation, ale nie należy zakładać, że każda istniejąca formuła jest poprawna lub kompletna. W skoroszycie występują miejsca oznaczone jako TBD oraz mechaniki zaimplementowane tylko częściowo.

---

## 2. Struktura skoroszytu

| Arkusz | Liczba formuł | Rola |
|---|---:|---|
| `Colony` | 52 | Główny model kolonii, dane wejściowe i prezentacja wyników |
| `Representative` | 9 | Przeliczenie charakterystyk reprezentanta na Bonus |
| `Data` | 0 | Dane referencyjne i parametry reguł |
| `Calculations` | 280 | Główny silnik obliczeniowy |
| **Razem** | **341** | |

Ogólny przepływ:

```text
Representative ─────┐
                    │
Data ───────────────┼──► Calculations ──► Colony
                    │
Colony ─────────────┘
```

---

## 3. Warstwy logiczne

Dla implementacji aplikacji warto traktować skoroszyt jako cztery podstawowe warstwy.

## 3.1. Input data

Dane wprowadzane przez użytkownika, m.in.:

- nazwa kolonii,
- typ kolonii,
- Size,
- bazowe charakterystyki,
- Representative,
- zasoby,
- Hard Infrastructure,
- Support Upgrades,
- custom bonuses/penalties.

## 3.2. Reference data

Dane z arkusza `Data`:

- Size → Profit Factor,
- parametry Hard Infrastructure,
- parametry Support Upgrades,
- limity Support Upgrades,
- modyfikatory poszczególnych elementów.

## 3.3. Business rules

Reguły określające:

- stany Complacency,
- stany Order,
- stany Productivity,
- stany Piety,
- wpływ infrastruktury,
- wpływ Support Upgrades,
- wpływ Representative,
- wpływ braków infrastruktury,
- wpływ stanu kolonii na Profit Factor.

## 3.4. Calculated values

Wyniki:

- Effective Size,
- Profit Factor,
- Effective Complacency,
- Effective Order,
- Effective Productivity,
- Effective Piety,
- statusy kolonii,
- ostrzeżenia o naruszeniu limitów.

---

## 4. Arkusz `Representative`

Ark
usz zawiera 9 formuł.

Dotyczą one:

- WS,
- BS,
- S,
- T,
- Ag,
- Int,
- Per,
- WP,
- Fel.

Każda charakterystyka jest przeliczana na Bonus:

```excel
=ROUNDDOWN(Value/10,0)
```

Czyli:

```text
Bonus = floor(Value / 10)
```

Przykład:

```text
Int 56 → +5
Per 39 → +3
Fel 45 → +4
```

Te Bonusy są następnie używane przez `Calculations`.

---

## 5. Arkusz `Data`

`Data` nie zawiera formuł. Jest tabelą referencyjną.

## 5.1. Colony Size

Mapowanie Size → Profit Factor:

| Size | PF | Nazwa |
|---:|---:|---|
| 0 | 0 | Ghost Town |
| 1 | 1 | Settlement |
| 2 | 2 | Outpost |
| 3 | 3 | Freehold |
| 4 | 4 | Domense |
| 5 | 6 | Holding |
| 6 | 8 | Dominion |
| 7 | 10 | Territory |
| 8 | 12 | City |
| 9 | 14 | Metropolis |
| 10 | 18 | Hive |

W Excelu wartości są pobierane przez `VLOOKUP`.

## 5.2. Hard Infrastructure

Zdefiniowane elementy:

- Transportation
- Power Network
- Water Management
- Food Production and Distribution
- Communications

Dla każdego elementu przechowywane są modyfikatory:

- Complacency bonus,
- Order bonus,
- Productivity bonus,
- Piety bonus,
- Complacency penalty,
- Order penalty,
- Productivity penalty,
- Piety penalty.

Przykład Transportation:

```text
Complacency +1
Productivity +1

Order -2
Productivity -2
```

## 5.3. Support Upgrades

Tabela zawiera m.in.:

- Arbites Precinct,
- Ecclesiarchy Missions,
- Mechanicum Mission,
- Mechanicum Mission – Mining / Industrial,
- Mechanicum Mission – Research,
- Infantry Garrison,
- Navy Station,
- Cultural Improvement – Complacency,
- Cultural Improvement – Order,
- Cultural Improvement – Productivity,
- Cultural Improvement – Piety,
- Industrial Facility,
- Personal Lodgings,
- Contacts,
- Trappings.

Dla każdego typu przechowywane są:

- limit,
- Complacency bonus,
- Order bonus,
- Productivity bonus,
- Piety bonus,
- dodatkowy efekt tekstowy.

---

## 6. Arkusz `Calculations`

`Calculations` zawiera 280 formuł i jest głównym silnikiem obliczeniowym.

---

## 6.1. Complacency — status

Stany:

```text
Complacency > Size → Placated
Complacency = 0    → Riots and unrests
otherwise          → Stable
```

Logika jest realizowana przez trzy warunki oraz wybór tekstu statusu.

---

## 6.2. Order — status

Stany:

```text
Order > Size → Orderly
Order = 0    → Anarchy
otherwise    → Stable
```

---

## 6.3. Productivity — status

Stany:

```text
Productivity > Size → Productive
Productivity = 0    → Halted
otherwise            → Stable
```

**Uwaga:** warunek używa `>`, nie `>=`.

---

## 6.4. Piety — status

Stany:

```text
Piety > Size → Pious
Piety = 0    → Heretical
otherwise    → Stable
```

---

## 7. Hard Infrastructure — obliczenia

Dla każdego typu infrastruktury Excel liczy:

```text
liczba działających
liczba uszkodzonych
```

Za pomocą `COUNTIFS`.

Dane pochodzą z obszaru infrastruktury w arkuszu `Colony`.

Następnie liczba elementów jest mnożona przez odpowiednie modyfikatory z `Data`.

Dla każdego typu powstają:

```text
Complacency bonus
Order bonus
Productivity bonus
Piety bonus

Complacency penalty
Order penalty
Productivity penalty
Piety penalty
```

Następnie bonus i penalty są sumowane do wartości netto:

```text
Net Complacency
Net Order
Net Productivity
Net Piety
```

Na końcu obliczane są globalne sumy dla całej infrastruktury.

---

## 8. Support Upgrades — obliczenia

Mechanizm jest analogiczny do Hard Infrastructure.

Dla każdego typu Support Upgrade liczone są:

```text
liczba działających
liczba niedziałających
```

Następnie:

```text
liczba × bonus
liczba × penalty
```

dla:

- Complacency,
- Order,
- Productivity,
- Piety.

Powstają wartości netto oraz globalne sumy.

---

## 9. Limity Support Upgrades

Dla każdego typu Support Upgrade istnieje limit.

Jeżeli:

```text
liczba wszystkich upgrade'ów > limit
```

Excel generuje:

```text
WARNING: Too many upgrades of this type!
```

Istnieje również globalne ograniczenie:

```text
liczba wszystkich Support Upgrades > Colony Size
```

→

```text
WARNING: Colony cannot have more Support Upgrades then its Size
```

W implementacji aplikacji te ostrzeżenia powinny być traktowane jako **walidacja reguł biznesowych**, a nie jako zwykły tekst UI.

---

## 10. Leadership Modifier

Leadership korzysta z charakterystyk Representative.

Excel pobiera maksimum spośród:

```text
Int Bonus
Per Bonus
Fel Bonus
```

Czyli:

```text
Leadership Bonus = MAX(Int Bonus, Per Bonus, Fel Bonus)
```

Dla przykładowego Representative:

```text
Int 56 → +5
Per 39 → +3
Fel 45 → +4

Leadership Bonus = +5
```

Następnie Bonus jest mapowany na modyfikator Profit Factor:

| Leadership Bonus | PF Effect |
|---:|---:|
| 2 | -2 |
| 3 | -1 |
| 4 | 0 |
| 5 | +1 |
| 6 | +2 |

Przykład:

```text
Leadership Bonus +5
→ PF modifier +1
```

---

## 11. `Colony` — Effective Size

Effective Size jest obliczany jako:

```text
Effective Size =
    Base Size
    + Growth/Decay
    + Custom Bonus
    + Custom Penalty
```

W Excelu:

```excel
=I3+SUM(B25:B27)
```

**Istotna obserwacja:**

`Effective Size` jest obecnie obliczany, ale główna logika nadal korzysta z `Colony!B7`, czyli Current Size.

Nie należy automatycznie zakładać, że Effective Size powinien zastąpić Current Size.

To wymaga decyzji projektowej.

---

## 12. Profit Factor

## 12.1. Base PF

Base PF pochodzi z tabeli Size:

```text
Size → Data → Profit Factor
```

Przykładowo:

```text
Size 1 → PF 1
Size 5 → PF 6
Size 10 → PF 18
```

## 12.2. Modyfikatory

Do PF mogą dochodzić m.in.:

### Placated

Jeżeli Complacency ma stan `Placated`:

```text
PF +1
```

### Productive

Jeżeli Productivity ma stan `Productive`:

```text
PF +2
```

### Leadership

PF otrzymuje modyfikator wynikający z Leadership Bonus.

Następnie sumowane są bonusy i kary.

Minimalna wartość przed końcową redukcją:

```text
PF >= 0
```

---

## 13. Wpływ Anarchy i Halted na Profit Factor

## Anarchy

Jeżeli:

```text
Order = 0
```

czyli:

```text
Order status = Anarchy
```

to:

```text
Profit Factor = 0
```

## Halted

Jeżeli Productivity = 0:

```text
PF = ceil(PF / 2)
```

Czyli Profit Factor jest zmniejszany o połowę, z zaokrągleniem w górę.

Anarchy ma pierwszeństwo przed tym mechanizmem.

---

## 14. Complacency — wartość efektywna

Model składa Complacency z kilku źródeł:

```text
Base Complacency
+ Piety-related modifier
+ Hard Infrastructure
+ Support Upgrades
+ Custom Bonus
+ Leadership
- Size-related penalty
- Piety-related penalty
- Infrastructure shortage
```

Wartość końcowa ma minimum:

```text
Complacency >= 0
```

---

## 15. Brak infrastruktury

Excel posiada mechanizm kary za brak infrastruktury.

W uproszczeniu:

```text
Required Infrastructure
-
Existing Infrastructure
=
Missing Infrastructure
```

Brakujące elementy powodują redukcję Complacency.

**Ważne:** aktualna formuła sumuje `działające + uszkodzone` elementy infrastruktury. Należy zweryfikować, czy jest to zgodne z zasadami gry, zanim mechanizm zostanie przeniesiony 1:1 do aplikacji.

---

## 16. Order — wartość efektywna

Order jest składany z:

```text
Base Order
+ Piety
+ Hard Infrastructure
+ Support Upgrades
+ Custom Bonus
+ Leadership
- Size-related penalty
- Complacency-related penalty
- Piety-related penalty
```

Jeżeli końcowa wartość spadnie do:

```text
Order = 0
```

status staje się:

```text
Anarchy
```

---

## 17. Productivity — wartość efektywna

Productivity uwzględnia:

```text
Base Productivity
+ Order-related bonus
+ Hard Infrastructure
+ Planetary Resources
+ Support Upgrades
+ Custom Bonus
+ Leadership
- Size-related penalty
- Complacency-related penalty
```

## Planetary Resources

Model przewiduje wpływ zasobów planety na Productivity.

Aktualnie odpowiednie pola są przygotowane, ale puste, więc nie generują obecnie modyfikatora.

To wygląda na przygotowanie pod przyszłą mechanikę.

---

## 18. Piety — wartość efektywna

Piety jest składane z:

```text
Base Piety
+ Hard Infrastructure
+ Support Upgrades
+ Custom Bonus
+ Leadership
- Size-related penalty
```

Piety nie otrzymuje bezpośredniego bonusu z Order ani Complacency.

---

## 19. Aktualny przykład stanu kolonii

Dla aktualnych danych w skoroszycie:

```text
Current Size       = 1
Effective Size     = 2

Complacency        = 3
Order              = 0
Productivity       = 1
Piety              = 0
```

Statusy:

```text
Complacency → Placated
Order       → Anarchy
Productivity→ Stable
Piety       → Heretical
```

Profit Factor:

```text
Base PF              = 1
Placated             = +1
Leadership           = +1
---------------------------
PF before penalties  = 3

Anarchy
→ Effective PF = 0
```

Czyli aktualny stan kolonii to:

```text
Placated / Anarchy / Stable / Heretical
```

z końcowym:

```text
Profit Factor = 0
```

---

## 20. Elementy niekompletne / TBD

Nie należy traktować obecnego skoroszytu jako kompletnej implementacji wszystkich zasad.

Najważniejsze niekompletne elementy:

## 20.1. Effective Size

Effective Size jest obliczany, ale nie jest jeszcze konsekwentnie używany jako źródło dla pozostałych obliczeń.

## 20.2. Size reduction penalties

W skoroszycie istnieją miejsca opisujące mechanikę:

```text
1d5 - 3
```

ale nie jest ona jeszcze zaimplementowana jako pełne obliczenie.

Dotyczy to m.in. kar dla:

- Complacency,
- Order,
- Productivity,
- Piety.

## 20.3. Planetary Resources

Pola są przygotowane, ale obecnie nie generują bonusu.

## 20.4. Leadership

Część modyfikatorów Leadership jest nadal wpisana bezpośrednio w `Colony`, zamiast wynikać w pełni z Representative.

## 20.5. Infrastructure shortage

Obecną formułę należy zweryfikować pod kątem tego, czy uszkodzona infrastruktura powinna być traktowana jako istniejąca dla tego konkretnego mechanizmu.

---

## 21. Zalecenie dla implementacji aplikacji

Excel powinien być traktowany jako:

> **UI mockup + reference data + business rules + częściowa reference implementation.**

Agent implementujący aplikację powinien:

1. Przeanalizować formuły i zależności przed implementacją.
2. Rozdzielić UI, dane wejściowe, dane referencyjne i logikę biznesową.
3. Nie kopiować bezrefleksyjnie każdej formuły do kodu.
4. Traktować `TBD`, placeholdery i niekompletne mechaniki jako wymagające decyzji.
5. Zachować zgodność z aktualną logiką Excela tam, gdzie nie ma sprzeczności lub jawnego TBD.
6. Sygnalizować rozbieżności pomiędzy regułami a implementacją Excela zamiast samodzielnie je „naprawiać”.
7. Nie modyfikować pliku Excel jako części implementacji.

---

## 22. Zalecana architektura aplikacji

Logicznie obecny Excel sugeruje następujący podział:

```text
Reference Data
    │
    ├── Colony Size
    ├── Infrastructure definitions
    ├── Support Upgrade definitions
    └── Modifier tables
          │
          ▼
Domain Model
    │
    ├── Colony
    ├── Representative
    ├── Infrastructure
    ├── SupportUpgrade
    └── Resources
          │
          ▼
Rules / Calculation Engine
    │
    ├── calculateSize()
    ├── calculateComplacency()
    ├── calculateOrder()
    ├── calculateProductivity()
    ├── calculatePiety()
    ├── calculateProfitFactor()
    └── validateUpgrades()
          │
          ▼
Application/UI
```

Nie oznacza to, że taka architektura jest obowiązkowa. Jest to model wynikający ze struktury obecnego skoroszytu.

---

## 23. Zasada dla agenta AI

Podczas implementacji agent powinien stosować następującą zasadę:

> **The Excel workbook is the current prototype and reference source for the colony mechanics. Analyze its formulas, dependencies and reference tables before implementing equivalent functionality. Do not assume that every formula is correct or complete. Explicit TBDs, placeholders, inconsistencies and partially implemented mechanics must be reported and clarified rather than silently changed.**

W szczególności agent powinien rozróżniać:

```text
1. UI / mockup
2. Input data
3. Reference data
4. Business rules
5. Calculated values
6. Warnings / validation
7. TBD / incomplete mechanics
```

---

## 24. Najważniejszy wniosek

Skoroszyt nie jest wyłącznie makietą.

Jest to działający prototyp:

```text
UI
+
Data Model
+
Reference Data
+
Business Rules
+
Calculation Engine
```

i zawiera **341 formuł**, z czego **280 znajduje się w `Calculations`**.

Dlatego przy implementacji aplikacji `.xlsx` powinien być traktowany jako ważne źródło referencyjne, ale nie jako nieomylna specyfikacja. Reguły jawnie niekompletne lub potencjalnie niespójne powinny zostać zidentyfikowane i rozstrzygnięte przed ich implementacją.

---

## 25. Phase 3b Implementation Cross-References

Phase 3b implemented Support Upgrades and Planetary Resources modules with core
rulebook rules. This section maps Excel sheet data to implemented code.

## 25.1 Support Upgrades

**Excel location:** `Data` sheet (upgrade definitions, limits), `Colony` sheet
(input fields for upgrades)

**Implemented in:**

- `config/support_upgrades.yaml` — all upgrade definitions with stat bonuses
- `config/upgrade_limits.json` — per-type limits
- `domain/rules/upgrade_validation.py` — validation logic
- `domain/models/support_upgrade.py` — data model

**Key rules implemented:**

- Global limit: upgrades ≤ Colony Size
- Per-type limits (Mechanicum=1, Cultural=5, etc.)
- Working vs. Faulty state bonuses/penalties

## 25.2 Planetary Resources

**Excel location:** `Colony` sheet (resource selection), `Data` sheet (resource
list)

**Implemented in:**

- `domain/enums.py` — `ResourceType` enum with all resource types
- `domain/models/colony.py` — `planetary_resources: list[ResourceType]`
- `domain/rules/colony_type_effects.py` — Mining/Industry and Research Mission
  resource bonuses

**Key rules implemented:**

- Mining/Industry + Mineral → +2 Productivity, +2 PF
- Research Mission + Organic/Archeotech/Xenos → +2 Productivity, +1 PF

## 25.3 State-Based Effects

**Excel location:** `Calculations` sheet (lore state formulas, crisis logic)

**Implemented in:**

- `domain/rules/state_effects.py` — Orderly, Pious, Anarchy, Crisis effects
- `domain/models/colony.py` — lock flags for stat crises

**Key rules implemented:**

- Orderly (Order > Size): +2 Productivity
- Pious (Piety > Size): +1 Order, +1 Complacency
- Complacency = 0: -1d5 Order & Productivity, locks increases
- Piety = 0: -1d5 Order & Complacency, locks increases
- Anarchy (Order = 0): per 90-day cycle, -1d5 C/P/Piety, -1 Size

## 25.4 Colony Type Special Rules

**Excel location:** `Data` sheet (colony type definitions), `Calculations`
(special bonuses)

**Implemented in:**

- `domain/rules/colony_type_effects.py`
- `config/colony_types.yaml` — colony type definitions

**Key rules implemented:**

- Ecclesiastical: convert Order loss → Piety loss (player choice)
- Agricultural: 1d10 ≥ 8 prevents Size decrease
- Mining/Industry + Mineral resource bonus
- Research Mission + research resource bonus

## 25.5 Dice Roll Handling

**Excel location:** `Calculations` sheet (RANDBETWEEN formulas for events/decay)

**Implemented in:**

- `domain/rules/state_effects.py` — dice rolls passed as parameters
- CLI/service layer generates actual random rolls (1d5, 1d10)
- Test code can inject deterministic rolls for reproducibility

**Design decision:** Rule engine is pure (no internal `random` calls); dice
rolls are injected from outside. This enables deterministic unit tests while
preserving randomness in production use.
