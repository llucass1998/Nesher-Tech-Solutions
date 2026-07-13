# Identity Migration

## Objetivo

Consolidar autenticacao LogiFlow no modelo `User`, preservando compatibilidade com o modelo legado `Driver`.

## Estado implementado

Modelos:

- `User`
- `DriverProfile`
- `RefreshSession`
- `Driver` legado preservado

Migrations relevantes:

- `20260712050000_identity_foundation`
- `20260713030000_driver_vehicle_status_columns`

## Estrategia gradual

1. Criar `User`, `DriverProfile` e `RefreshSession`.
2. Migrar cada `Driver` legado para `User` com role `DRIVER`.
3. Criar `DriverProfile` vinculado ao `Driver`.
4. Manter `Driver.password` temporariamente para compatibilidade de rotas legadas.
5. Fazer endpoints v1 usarem `User`.
6. Depreciar rotas antigas.
7. Remover campos legados apenas apos consumidores migrarem.

## Compatibilidade

`Delivery` ainda referencia `Driver`, entao `DriverProfile.driverId` e necessario durante a transicao.

## Validacoes esperadas

- Driver legado continua funcionando nas rotas antigas.
- Registro v1 cria `User` e perfil quando aplicavel.
- Login v1 retorna usuario sem hashes.
- Motorista autenticado so acessa entregas proprias.
- Migration aplica em banco limpo via Docker `logiflow-migrate`.
