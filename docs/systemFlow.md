# Talent Management System Flow

## Overview

This system is designed around a progressive competition pipeline. The competition does not start at the national level; it begins at the school level and moves upward through the hierarchy of the education system.

The intended progression is:

School -> District -> Zone -> Country

This means each level has its own set of results, selection decisions, and promotion rules. A student is not automatically treated as a national-level participant; instead, they must first perform well at the school level, then be promoted by the relevant authority to the next level.

---

## 1. School-level competition

The competition process starts inside individual schools.

At this stage:
- students participate in school competitions or school-based talent evaluation
- the sport teacher is the primary person responsible for entering competition results
- results can be entered in two ways:
  1. manually, one student at a time from the sport teacher page
  2. by uploading an Excel sheet in the format defined by the system

The sports teacher records the score of each student per talent or competition category. This data is treated as the source result for that student at school level.

The result data at this level is important because it forms the foundation for all subsequent promotions. It is not just a record for the school; it is the raw performance data used to decide whether a student qualifies for the next stage.

### School role expectations
The school-level user is expected to:
- create or confirm the list of participating students
- record scores or upload results for the competition
- ensure the results match the expected format and validation rules
- confirm that the result belongs to the correct student and school

---

## 2. District-level review and promotion

Once the school-level results are recorded, they are visible to the district manager through the district dashboard.

At this point, the district manager reviews the submitted school-level performance data for all relevant schools inside the district. The manager is expected to compare student results and identify which students qualify to proceed to district-level competition.

The district manager does not simply accept all results. The system allows the district manager to promote selected students based on score and performance while leaving others out.

This decision is critical because it acts as the first screening stage after school competition.

### District manager responsibilities
The district manager is expected to:
- view school results across the district
- review student performance by school and ward
- identify top-performing students for promotion
- select students who qualify to participate in district-level competition
- reject or leave out students who do not meet the required standard
- announce the district competition after promotions are finalized

This is a district leadership and selection role. The district manager is not simply checking statistics; they are making the selection decision that determines who advances from school level to district level.

### District-level competition
After promotion:
- selected students move into the district competition phase
- the district manager may organize the district event or competition day
- district-level results are then captured using the same mechanism:
  - manual entry by the district manager or assigned district result recorder
  - or Excel upload using the official format

This means the same result capture structure continues at the next level, except the performance now represents district competition results rather than school competition results.

---

## 3. Zone-level progression

The flow continues beyond the district level to the zone.

Once district competition results are completed and validated, the best-performing students or teams from the district are promoted to the zone level. At this point, the district acts as a feeder to the zone.

The zone manager is then responsible for:
- reviewing district results coming into the zone
- confirming which students continue to the zone competition
- overseeing zone-level competition arrangements
- entering or uploading zone-level results
- preparing eligible students for the next stage

This continues the same idea of progressive advancement:
- school champions become district qualifiers
- district qualifiers become zone participants
- zone performers become country-level contestants

---

## 4. Country-level progression

The final stage is the country level.

At the country level:
- the best-performing students from the zone qualify for national competition or country-level evaluation
- the talent admin or national-level system authority oversees the final promotion and result recording process
- country-level results are used for final ranking, awards, and final recognition

This establishes a full progression chain where results are not isolated to a single level but move upward as a structured performance ladder.

---

## 5. Promotion logic across the system

The result progression is hierarchical and follows a top-down quality flow:

1. School competition results are recorded by the sport teacher.
2. District manager reviews and promotes selected students.
3. District competition results are recorded after district competition.
4. Zone manager reviews district results and promotes to zone competition.
5. Zone competition results are recorded and promoted to country level.
6. Country-level results are finalized for national recognition and ranking.

This progression is important for the system because it ensures that:
- each level has its own set of participants
- only qualified students advance
- scores are compared and selected based on performance
- the competition process is structured and not random

---

## 6. Why the ward manager is skipped in this flow

In the current workflow described here, the ward manager is intentionally excluded. The design is simplified so the district manager takes on the promotion and coordination role directly instead of having a separate ward-level intermediary.

This does not mean the ward level is impossible in the system; it means that for this particular competition process, the route used for now is:

School -> District -> Zone -> Country

The ward manager can be introduced later if the project requires finer monitoring or approval steps between school and district, but it is not part of the current competition mechanism being used.

---

## 7. Summary of responsibilities by role

### Sport teacher
- records school results
- uploads Excel results for school-level participation
- ensures student scores are correct
- prepares school competitors for district promotion

### District manager
- reviews district school results
- promotes students to district competition
- organizes district competition
- records or supervises district result capture
- selects students to move upward toward the zone

### Zone manager
- reviews district results
- organizes zone competition
- promotes selected students to country-level participation
- records zone results

### Talent admin / country-level authority
- oversees the final national or country competition
- validates the final result flow
- manages final recognition, ranking, and country-level advancement

---

## 8. Final developer note

The core idea of the system is not only to store scores, but to create a structured promotion pipeline from local competition to higher-level competition. Every stage is built to produce a clear and auditable path from the school competition floor up to the national competition level.

For developers, the important implementation principle is:
- school results feed district decisions
- district results feed zone decisions
- zone results feed country decisions
- each level is independent but connected through promotion and advancement rules

This should be treated as the official competition flow for the system unless the business rules are later changed.
