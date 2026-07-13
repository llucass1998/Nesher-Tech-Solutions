# Domains

## LogiFlow

LogiFlow remains responsible for logistics operations: drivers, vehicles, deliveries, operational status and delivery revenue indicators.

## LogiPeople

LogiPeople is an independent HR and Departamento Pessoal system. In phases 1-14, the foundation, Organization, Core People, preliminary Analytics, preliminary Recruitment, preliminary Onboarding, preliminary Time and Attendance, preliminary Payroll, preliminary Payslips, preliminary Benefits and preliminary Absence and Vacation foundations are implemented.

### Implemented in phases 1-14

- Identity integration boundary.
- RBAC and ABAC primitives.
- Field-level access-control classification.
- Audit and data-access log primitives.
- Organization structure.
- Core People records.
- Employee history with effective dating.
- Analytics foundation with aggregated status metrics and governance counts.
- Recruitment foundation with preliminary openings, candidates and applications.
- Onboarding foundation with preliminary internal plans and checklist tasks.
- Time and Attendance foundation with work schedules, time entries and preliminary attendance periods.
- Payroll foundation with cycles, preliminary runs, payroll items and audited reopening requests.
- Preliminary payslip foundation with restricted demonstrative records derived from payroll runs and lines copied from payroll items.
- Benefits foundation with plans and preliminary enrollments.
- Absence and Vacation foundation with preliminary absence requests and vacation periods.

### Deferred domains

The following domains are documented as future modules and must not be represented as complete or legally validated in this phase:

- Recruitment job-board publishing, offer management, hiring automation and candidate-to-employee conversion.
- Onboarding workflow automation, external provisioning, admission approval and candidate-to-employee conversion.
- Time and Attendance legal/payroll rule validation.
- Absence and Vacation legal balance calculation, automatic approvals, payroll effects and eSocial events.
- Benefits provider integrations, eligibility/legal validation and definitive payroll deductions.
- Payroll legal calculation, homologation and payment execution.
- Official payslip publication, legally validated payslip calculation, PDF generation, signature workflow and employee-facing payslip release.
- Termination.
- Government reporting and eSocial.
- AI assistants.
- Advanced analytics, individual-level BI, predictive models and legally validated reports.
- Real LogiFlow and LogiDesk integrations.

## Organization vs Core People

Organization defines the company structure: company, legal entity, branch, department, cost center, team, job and position.

Core People defines people and employment records: person, employee, employment, contract, assignments, manager, compensation history and status history.

## Departamento Pessoal boundary

DP-sensitive records such as contracts, compensation history, documents, time-attendance evidence, preliminary analytics aggregates, preliminary recruitment records, preliminary onboarding records, preliminary absence/vacation records, preliminary payroll records, preliminary payslip records and preliminary benefits records are modeled with data classification and audit from the beginning, but individual-level BI, predictive analytics, candidate-to-employee conversion, onboarding automation, absence/vacation legal balance calculations, payroll legal calculations, official payslip publication, benefits provider integrations, payment execution and eSocial real submission are not implemented in phases 1-14.
