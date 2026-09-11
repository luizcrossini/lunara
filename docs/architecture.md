# 🏗️ LUNARA — Software Architecture

> **Versão:** 2.0.0  
> **Última atualização:** Julho/2026  
> **Status:** Em desenvolvimento

---

# 📖 Visão Geral

O **Lunara** é uma plataforma SaaS (Software as a Service) Multi-Tenant especializada em gestão de agendamentos para salões de beleza, clínicas de estética e profissionais autônomos.

Mais do que um sistema de agenda, o Lunara será uma plataforma que conecta empresas e clientes, oferecendo uma experiência moderna de descoberta, agendamento, gestão e fidelização.

A arquitetura foi projetada para suportar desde um único salão até grandes redes de franquias, mantendo performance, segurança e facilidade de manutenção.

---

# 🎯 Objetivos

Toda decisão técnica do projeto deverá seguir os princípios abaixo.

- Escalabilidade
- Simplicidade
- Segurança
- Performance
- Baixo acoplamento
- Alta coesão
- Código reutilizável
- Multiempresa (Multi-Tenant)
- Mobile First
- API First
- Componentização
- Fácil manutenção
- Internacionalização
- Excelente experiência do usuário

---

# 🏛 Arquitetura Geral

```text
                Cliente

                   │

        Aplicativo Mobile
            React Native
              Expo Router

                   │

             API NestJS

                   │

               Prisma ORM

                   │

         PostgreSQL (Supabase)

                   │

    Storage • Auth • Realtime
```

Toda regra de negócio ficará na API.

O aplicativo nunca acessará diretamente o banco de dados.

---

# 🚀 Stack Oficial

## Mobile

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind
- Redux Toolkit
- RTK Query
- React Hook Form
- Zod
- Axios
- MMKV (persistência local)

---

## Backend

- NestJS
- TypeScript
- Prisma
- JWT
- Bcrypt
- BullMQ
- Redis

---

## Banco de Dados

- Supabase
- PostgreSQL

---

## DevOps

- GitHub
- GitHub Actions
- Docker
- Railway

---

# 📁 Estrutura do Projeto

```text
lunara/

apps/
│
├── mobile/
└── api/

packages/
│
├── ui/
├── types/
├── utils/
├── config/
├── eslint-config/
└── tsconfig/

docs/

infra/

scripts/

.github/
```

---

# 📱 Aplicações

## Mobile

Responsável pela experiência dos usuários.

Tipos de usuários:

- Cliente
- Proprietário
- Funcionário
- Administrador

---

## API

Responsável por:

- Regras de negócio
- Autenticação
- Autorização
- Banco de dados
- Integrações
- Pagamentos
- Notificações
- Auditoria

---

# 📱 Arquitetura Mobile

```text
src/

app/

core/

features/

shared/
```

---

## App

Responsável apenas pelas rotas do Expo Router.

Nunca conterá regra de negócio.

```text
app/

(auth)

(customer)

(owner)

(employee)

(admin)
```

---

## Core

Tudo que é utilizado por todo o aplicativo.

```text
core/

api/

config/

constants/

hooks/

navigation/

providers/

services/

store/

theme/

types/

utils/
```

---

## Features

Cada funcionalidade do sistema será uma Feature.

```text
features/

auth/

booking/

customer/

dashboard/

employee/

notifications/

owner/

profile/

salon/

services/
```

Cada Feature será completamente independente.

Exemplo:

```text
booking/

components/

hooks/

pages/

services/

validators/

types/
```

---

## Shared

Componentes compartilhados.

```text
shared/

components/

icons/

animations/
```

Exemplos:

- Button
- Input
- Card
- Modal
- Avatar
- Toast
- Badge
- Loading

---

# 🎨 Design System

Todo o projeto utilizará um Design System próprio.

Jamais serão utilizadas cores diretamente nos componentes.

Errado:

```tsx
backgroundColor: "#A855F7"
```

Correto:

```tsx
colors.primary
```

---

## Tokens

```text
theme/

colors.ts

spacing.ts

radius.ts

typography.ts

shadows.ts

animations.ts

index.ts
```

---

# 🗄️ Arquitetura Backend

```text
src/

modules/

auth/

users/

salons/

appointments/

employees/

customers/

services/

payments/

notifications/

reviews/

shared/

config/

database/
```

Cada módulo possuirá:

```text
controller

service

repository

dto

entity

guards

interceptors

validators

tests
```

---

# 🏢 Multi-Tenant

O Lunara é um SaaS Multiempresa.

Cada empresa terá isolamento completo dos dados.

Todas as tabelas possuirão:

```text
salon_id
```

Exemplo:

```text
Appointments

id

salon_id

customer_id

employee_id

service_id

date

status
```

Nenhum salão poderá acessar dados de outro.

---

# 🔐 Autenticação

Uma única autenticação para todo o sistema.

Perfis:

- ADMIN
- OWNER
- EMPLOYEE
- CUSTOMER

Após o login, a API identificará automaticamente o perfil do usuário.

---

# 📡 Fluxo Geral

```text
Cliente

↓

Aplicativo

↓

API

↓

Prisma

↓

Supabase

↓

Resposta
```

---

# 🧠 Gerenciamento de Estado

Será utilizado:

## Redux Toolkit

Responsável por:

- Sessão
- Usuário
- Empresa
- Tema
- Preferências
- Estados globais

---

## RTK Query

Responsável por:

- Cache
- Requisições
- Retry
- Invalidação
- Polling
- Paginação
- Atualização automática

---

# 🌐 Navegação

Expo Router.

Toda navegação será baseada em arquivos.

---

# 🎨 Estilização

NativeWind.

Nunca utilizar StyleSheet para componentes de interface.

Todo componente deverá utilizar o Design System do Lunara.

---

# 📦 Packages Compartilhados

## @lunara/ui

Componentes compartilhados.

---

## @lunara/types

Interfaces compartilhadas.

---

## @lunara/utils

Funções utilitárias.

---

## @lunara/config

Constantes e configurações.

---

## @lunara/eslint-config

Configuração compartilhada do ESLint.

---

## @lunara/tsconfig

Configuração compartilhada do TypeScript.

---

# 📏 Convenções

Nunca utilizar:

```ts
../../../
```

Sempre utilizar aliases:

```ts
@/
```

Exemplo:

```ts
import Button from "@/shared/components/Button";
```

---

# 🧩 Padrões Arquiteturais

O projeto utilizará:

- Clean Architecture
- SOLID
- Domain Driven Design (DDD)
- Feature First
- Repository Pattern
- Dependency Injection
- DTO Pattern
- Component Driven Development

---

# 🌳 Git Flow

Branches:

```text
main

develop

feature/*

fix/*

hotfix/*
```

---

# 📝 Commits

Será utilizado Conventional Commits.

Exemplos:

```text
feat(auth): create login

feat(booking): create appointment flow

fix(schedule): overlap validation

docs: update architecture
```

---

# ✅ Definition of Done

Uma funcionalidade somente poderá ser considerada pronta quando:

- Código implementado
- Testado
- Revisado
- Documentado
- Sem erros de lint
- Sem erros de TypeScript
- Build realizado com sucesso
- Commit realizado

---

# 📈 Escalabilidade

A arquitetura deverá suportar:

- 100 salões
- 1.000 salões
- 10.000 salões
- 100.000 clientes

Sem necessidade de alteração estrutural.

---

# 🚀 Futuras Aplicações

Além do aplicativo Mobile, o ecossistema Lunara possuirá:

- Painel Web do Salão
- Landing Page
- Portal Administrativo
- API Pública
- SDK
- Aplicativo para Profissionais (futuro)

---

# 🗺️ Roadmap Técnico

## Sprint 1

Infraestrutura

## Sprint 2

Design System

## Sprint 3

Banco de Dados

## Sprint 4

Autenticação

## Sprint 5

Cadastro de Empresas

## Sprint 6

Cadastro de Profissionais

## Sprint 7

Cadastro de Serviços

## Sprint 8

Agenda

## Sprint 9

Agendamento Público

## Sprint 10

Dashboard

## Sprint 11

Financeiro

## Sprint 12

Pagamentos

## Sprint 13

Notificações

## Sprint 14

Inteligência Artificial

## Sprint 15

Deploy

---

# 💜 Filosofia do Projeto

O Lunara não é apenas um sistema de agendamento.

O Lunara será a principal plataforma de relacionamento entre clientes e empresas do mercado de beleza e estética.

Cada decisão técnica deverá priorizar:

- Escalabilidade
- Performance
- Segurança
- Simplicidade
- Excelente experiência do usuário
- Facilidade de manutenção
- Reutilização de código
- Baixo custo operacional
- Alta disponibilidade

Nosso objetivo é construir um produto preparado para crescer durante muitos anos sem exigir reescritas da arquitetura.