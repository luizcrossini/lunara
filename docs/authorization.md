# 🔐 LUNARA — Authorization Architecture

> Version: 1.0.0
> Last Update: July/2026

---

# Objetivo

O Lunara utiliza uma arquitetura híbrida baseada em:

- RBAC (Role Based Access Control)
- ABAC (Attribute Based Access Control)

Essa arquitetura garante flexibilidade, escalabilidade e segurança.

---

# Arquitetura

```
User
   │
Membership
   │
RoleAssignment
   │
Role
   │
RolePermission
   │
Permission

↓

Policies (ABAC)
```

---

# Camadas

## Identity

Representa uma pessoa.

Nunca possui permissões.

Nunca possui papéis.

Tabela:

User

---

## Membership

Representa o vínculo de uma pessoa com uma empresa.

Um usuário pode possuir vários Memberships.

Exemplo:

João

↓

Studio Bella

↓

Nova Lima

↓

Owner

↓

Clínica Essence

↓

Customer

---

Membership possui:

- user
- company
- branch
- status
- datas
- papéis

---

## Role

Role representa uma função.

Exemplos:

Owner

Manager

Receptionist

Employee

Customer

Financial

Marketing

Supervisor

---

Role NÃO possui lógica.

Role apenas agrupa permissões.

---

## Permission

Representa uma ação.

Formato:

module.action

Exemplo

appointments.create

appointments.update

customers.edit

dashboard.view

---

## RoleAssignment

Relacionamento N:N

Membership

↓

Role

Um Membership pode possuir vários papéis.

---

## RolePermission

Relacionamento N:N

Role

↓

Permission

---

# RBAC

Responsável por responder:

"O usuário possui esta permissão?"

Exemplo

appointments.create

↓

SIM

---

# ABAC

Responsável por responder:

"O usuário pode executar esta ação neste recurso específico?"

Exemplo

Recepcionista

↓

Pode editar agendamentos

↓

Somente da própria unidade

---

# Policies

Cada módulo possuirá uma Policy.

Exemplos

AppointmentPolicy

CustomerPolicy

ProfessionalPolicy

FinancialPolicy

DashboardPolicy

NotificationPolicy

---

Exemplo

AppointmentPolicy.canCancel()

Fluxo

Possui permission?

↓

Pertence à empresa?

↓

Pertence à unidade?

↓

Está dentro do horário permitido?

↓

Pode cancelar?

---

# Ownership

Owner

Pode visualizar qualquer unidade da empresa.

---

Manager

Pode visualizar apenas unidades vinculadas.

---

Employee

Pode acessar somente sua agenda.

---

Customer

Pode acessar apenas seus próprios dados.

---

Admin

Pode acessar qualquer empresa.

---

# Guards

NestJS utilizará:

Authentication Guard

Authorization Guard

Permission Guard

Policy Guard

---

# Fluxo de Autorização

Login

↓

JWT

↓

Membership Ativo

↓

Roles

↓

Permissions

↓

Policy

↓

Controller

↓

Service

---

# Princípios

Nunca verificar:

if(role=="Owner")

Sempre verificar:

Permission

+

Policy

---

# Benefícios

- Escalável
- Multiempresa
- Multiunidade
- Multi papéis
- Sem duplicação
- Fácil manutenção
- Enterprise Ready