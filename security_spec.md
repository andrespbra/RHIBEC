# Security Specification - Holerite Premium

## Data Invariants
- A holerite must have a valid `pdfUrl` and be linked to an existing `userId`.
- Users cannot change their own roles.
- Holerites are immutable once created (except for deletion by admin).

## Identity & Access
- **Admin**: Has full read/write access.
- **Employee**: Can only read their own user profile and holerites where `employeeId` matches their `uid`.

## The Dirty Dozen Payloads (Rejection Tests)
1. Update `role` from "employee" to "admin" as an employee.
2. Read a holerite belonging to another employee ID.
3. Create a holerite for another user.
4. Upload a holerite with an invalid month (e.g., 13).
5. Delete a holerite as an employee.
6. List all holerites as an employee.
7. Update `pdfUrl` of a holerite as an employee.
8. Create a user profile with a pre-set `role: "admin"`.
9. Inject 1MB string into the `name` field.
10. Access PII (email) of another user.
11. Update `uploadedAt` to a past date.
12. Create a holerite document without a `pdfUrl`.
