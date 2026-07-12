# Domains

## LogiFlow

LogiFlow remains responsible for logistics operations: drivers, vehicles, deliveries, operational status and delivery revenue indicators.

## LogiPeople

LogiPeople is an independent HR and Departamento Pessoal system. In phases 1-6, only the foundation, Organization and Core People domains are implemented.

### Implemented in phases 1-6

- Identity integration boundary.
- RBAC and ABAC primitives.
- Field-level access-control classification.
- Audit and data-access log primitives.
- Organization structure.
- Core People records.
- Employee history with effective dating.

### Deferred domains

The following domains are documented as future modules and must not be represented as complete or legally validated in this phase:

- Recruitment.
- Onboarding beyond foundation records.
- Time and Attendance.
- Absence and Vacation.
- Benefits.
- Payroll.
- Payslips.
- Termination.
- Government reporting and eSocial.
- AI assistants.
- Analytics.
- Real LogiFlow and LogiDesk integrations.

## Organization vs Core People

Organization defines the company structure: company, legal entity, branch, department, cost center, team, job and position.

Core People defines people and employment records: person, employee, employment, contract, assignments, manager, compensation history and status history.

## Departamento Pessoal boundary

DP-sensitive records such as contracts, compensation history and documents are modeled with data classification and audit from the beginning, but payroll and legal calculations are not implemented in phases 1-6.
