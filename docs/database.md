# 🗄️ LUNARA — DATABASE DESIGN

> Versão: 1.0.0
> Última atualização: Julho/2026
> Status: Em Modelagem

---

# Objetivo

Este documento define toda a estrutura de dados do Lunara.

Todas as implementações do Prisma, Supabase, NestJS e Mobile deverão seguir este documento.

---

# Arquitetura

O Lunara é um SaaS Multi-Tenant.

```text
Company
   │
   ├── Branch
   │      │
   │      ├── Services
   │      ├── Professionals
   │      ├── Customers
   │      └── Appointments
   │
   └── Subscription
```

---

# Entidades

## Company

Representa a empresa proprietária do negócio.

Exemplo:

- Studio Bella
- Espaço Glamour
- Clínica Essence

### Campos

| Campo | Tipo | Obrigatório |
|--------|------|-------------|
| id | UUID | ✅ |
| corporate_name | String | ✅ |
| trade_name | String | ✅ |
| document | String | ✅ |
| email | String | ✅ |
| phone | String | ✅ |
| logo_url | String | ❌ |
| status | Enum | ✅ |
| created_at | DateTime | ✅ |
| updated_at | DateTime | ✅ |

---

Relacionamentos

Company

↓

Branches

↓

Subscription

↓

Users

---

# Branch

Cada unidade física.

Exemplo

Studio Bella

↓

Nova Lima

↓

Savassi

↓

Lourdes

---

Campos

| Campo | Tipo |
|--------|------|
| id | UUID |
| company_id | UUID |
| name | String |
| slug | String |
| phone | String |
| email | String |
| address_id | UUID |
| timezone | String |
| appointment_interval | Integer |
| status | Enum |

---

Relacionamentos

Branch

↓

WorkingHours

↓

ProfessionalBranch

↓

Categories

↓

Services

↓

Appointments

↓

Customers

---

# Address

Endereço reutilizável.

Campos

logradouro

numero

bairro

cidade

estado

cep

latitude

longitude

---

# User

Representa uma pessoa.

Um usuário pode ser:

Cliente.

Funcionário.

Proprietário.

Administrador.

Campos

id

name

email

phone

password

photo_url

birth_date

gender

status

created_at

updated_at

---

# UserRole

Relacionamento N:N.

Um usuário pode possuir vários papéis.

ADMIN

OWNER

EMPLOYEE

CUSTOMER

---

# Professional

Informações específicas do profissional.

Campos

id

user_id

bio

instagram

specialties

active

---

# ProfessionalBranch

Relaciona profissional e unidade.

Campos

professional_id

branch_id

commission_type

commission_value

start_date

end_date

status

---

# WorkingHours

Horário de funcionamento da unidade.

Campos

branch_id

weekday

open_time

close_time

closed

---

# ProfessionalWorkingHours

Horário individual do profissional.

Campos

professional_branch_id

weekday

start_time

end_time

---

# ScheduleBlock

Bloqueios de agenda.

Campos

professional_branch_id

requested_by

approved_by

reason

start_at

end_at

status

---

Status

PENDING

APPROVED

REJECTED

---

# Category

Categorias dos serviços.

Exemplo

Cabelo

Barba

Estética

Massagem

Unhas

---

Campos

id

branch_id

name

description

icon

active

---

# Service

Serviço.

Campos

id

category_id

name

description

duration

active

---

Observação

O serviço não possui preço.

---

# ProfessionalService

Relaciona profissional e serviço.

Campos

professional_id

service_id

price

active

---

Assim:

Escova

↓

Maria

90

↓

Fernanda

110

---

# ServicePackage

Pacotes.

Exemplo

Dia da Noiva

↓

Escova

↓

Maquiagem

↓

Massagem

---

Campos

id

branch_id

name

description

price

active

---

# PackageItem

Relaciona

Pacote

↓

Serviço

---

# Customer

Cliente.

Campos

id

user_id

preferred_branch

notes

allergies

preferences

instagram

---

# Favorite

Salões favoritos.

Campos

customer_id

branch_id

created_at

---

# AppointmentOrder

Representa um pedido de agendamento.

Campos

id

customer_id

branch_id

status

scheduled_date

notes

created_at

---

Status

PENDING

CONFIRMED

IN_PROGRESS

FINISHED

CANCELLED

NO_SHOW

---

# AppointmentItem

Cada serviço do pedido.

Campos

id

appointment_order_id

professional_service_id

start_at

end_at

price

status

---

Exemplo

Pedido

↓

Escova

Maria

↓

Manicure

Fernanda

---

# Review

Avaliação.

Campos

appointment_order_id

customer_id

professional_id

rating

comment

created_at

---

# Notification

Campos

id

user_id

type

title

message

status

sent_at

read_at

---

Tipos

PUSH

EMAIL

---

# LoyaltyAccount

Conta de fidelidade.

Campos

customer_id

balance

level

---

# LoyaltyTransaction

Movimentação.

Campos

customer_id

points

type

description

created_at

---

Tipos

EARN

REDEEM

EXPIRE

ADJUSTMENT

---

# Subscription

Plano contratado.

Campos

company_id

plan

status

started_at

expires_at

---

Planos

FREE

STARTER

PRO

ENTERPRISE

---

# AuditLog

Auditoria.

Campos

user_id

action

entity

entity_id

old_values

new_values

created_at

---

# Relacionamentos

```text
Company
    │
    ├── Branch
    │      │
    │      ├── Category
    │      │      │
    │      │      └── Service
    │      │
    │      ├── WorkingHours
    │      │
    │      ├── ProfessionalBranch
    │      │         │
    │      │         └── Professional
    │      │
    │      ├── AppointmentOrder
    │      │         │
    │      │         └── AppointmentItem
    │      │
    │      └── Customers
    │
    └── Subscription
```

---

# Multi-Tenant

Toda consulta deverá respeitar:

company_id

ou

branch_id

Nunca será permitido acesso entre empresas.

---

# Soft Delete

Todas as entidades principais possuirão:

deleted_at

Assim nenhum dado será perdido.

---

# Auditoria

Todas as alterações críticas serão registradas.

- Exclusões
- Alterações de preço
- Alterações de agenda
- Cancelamentos
- Aprovações

---

# Escalabilidade

O modelo foi projetado para suportar:

- Empresas com múltiplas unidades.
- Profissionais compartilhados entre unidades.
- Múltiplos serviços por agendamento.
- Múltiplos profissionais no mesmo atendimento.
- Pacotes de serviços.
- Programa de fidelidade.
- Assinaturas.
- Expansão para novos módulos sem refatoração estrutural.