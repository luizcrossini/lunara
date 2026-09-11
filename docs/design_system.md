# 🎨 LUNARA — Design System

> **Versão:** 2.0.0  
> **Última atualização:** Julho/2026  
> **Status:** Oficial

---

# Índice

1. Filosofia
2. Princípios
3. Identidade da Marca
4. Design Tokens
5. Cores
6. Tipografia
7. Espaçamentos
8. Radius
9. Sombras
10. Animações
11. Grid
12. Componentes
13. Ícones
14. Estados
15. Feedback
16. Acessibilidade
17. UX
18. Convenções

---

# Filosofia

O Lunara não é apenas um sistema de agendamento.

O Lunara deve transmitir a sensação de um aplicativo premium.

Toda interface deverá parecer:

• elegante

• organizada

• moderna

• feminina

• tecnológica

• intuitiva

O usuário deve sentir confiança antes mesmo de utilizar qualquer funcionalidade.

---

# Princípios

Todo componente deverá seguir estes princípios.

## Clareza

O usuário nunca deve precisar pensar para descobrir o próximo passo.

---

## Simplicidade

Menos elementos.

Mais espaço.

Menos distrações.

---

## Consistência

O mesmo componente sempre deverá ter o mesmo comportamento.

---

## Rapidez

Todas as ações deverão parecer instantâneas.

---

## Elegância

A beleza deverá surgir através de:

- espaçamento
- tipografia
- cores
- animações

Nunca através de excesso de elementos.

---

# Identidade da Marca

## Conceito

A marca representa:

• Beleza

• Tecnologia

• Organização

• Sofisticação

• Bem-estar

• Exclusividade

---

## Personalidade

A interface deve parecer:

✔ Premium

✔ Moderna

✔ Delicada

✔ Minimalista

✔ Intuitiva

Nunca:

✘ Infantil

✘ Poluída

✘ Antiga

✘ Exageradamente colorida

---

# Paleta Oficial

## Primary

```ts
#F472B6
```

---

## Primary Dark

```ts
#EC4899
```

---

## Secondary

```ts
#C084FC
```

---

## Accent

```ts
#9333EA
```

---

## Accent Dark

```ts
#7E22CE
```

---

# Semantic Colors

## Success

```ts
#22C55E
```

---

## Warning

```ts
#F59E0B
```

---

## Error

```ts
#EF4444
```

---

## Info

```ts
#3B82F6
```

---

# Neutral Scale

```ts
white

#FFFFFF
```

```ts
gray50

#FAFAFA
```

```ts
gray100

#F5F5F5
```

```ts
gray200

#E5E7EB
```

```ts
gray300

#D1D5DB
```

```ts
gray400

#9CA3AF
```

```ts
gray500

#6B7280
```

```ts
gray600

#4B5563
```

```ts
gray700

#374151
```

```ts
gray800

#1F2937
```

```ts
gray900

#111827
```

---

# Gradiente Oficial

```css
linear-gradient(
135deg,
#F472B6 0%,
#C084FC 60%,
#9333EA 100%
)
```

Esse será o único gradiente utilizado.

---

# Design Tokens

Toda interface utilizará apenas tokens.

Jamais utilizar valores diretamente.

Errado:

```tsx
padding:18
```

Correto:

```tsx
padding:spacing.lg
```

---

# Espaçamentos

```ts
xxs = 2

xs = 4

sm = 8

md = 16

lg = 24

xl = 32

2xl = 40

3xl = 48

4xl = 64

5xl = 96
```

---

# Radius

```ts
none

xs = 4

sm = 8

md = 12

lg = 16

xl = 24

2xl = 32

pill = 999

full = 9999
```

---

# Tipografia

## Fonte

Principal

Manrope

Fallback

Inter

SF Pro Display

---

# Pesos

Regular

400

Medium

500

SemiBold

600

Bold

700

ExtraBold

800

---

# Escala

Display

48

---

H1

36

---

H2

30

---

H3

24

---

Title

20

---

Subtitle

18

---

Body

16

---

Body Small

14

---

Caption

12

---

Micro

10

---

# Sombras

## Small

```css
0 2 8 rgba(0,0,0,.06)
```

---

## Medium

```css
0 8 24 rgba(0,0,0,.10)
```

---

## Large

```css
0 16 48 rgba(0,0,0,.14)
```

---

## XL

```css
0 24 72 rgba(0,0,0,.18)
```

---

# Grid

Todo o sistema utilizará:

8 Point Grid

Nunca utilizar:

13

19

27

---

# Motion

Fast

150ms

Normal

250ms

Slow

400ms

Curva

ease-out

---

# Ícones

Biblioteca oficial

Lucide React Native

Nunca misturar bibliotecas.

---

# Componentes Base

Todos os componentes do Lunara serão construídos a partir destes componentes.

Button

IconButton

Input

PasswordInput

SearchBar

TextArea

Select

DatePicker

TimePicker

Calendar

Avatar

Badge

Chip

Card

Divider

BottomSheet

Modal

Dialog

Tabs

SegmentedControl

Switch

Checkbox

Radio

Progress

Toast

Snackbar

Skeleton

Loading

EmptyState

---

# Componentes de Negócio

SalonCard

ProfessionalCard

AppointmentCard

ServiceCard

PromotionCard

FavoriteCard

ReviewCard

HistoryCard

BookingStepper

WorkingHours

AgendaTimeline

---

# Estados

Todo componente deverá possuir estados.

Default

Hover

Pressed

Focused

Disabled

Loading

Success

Error

Selected

---

# Feedback

Sempre informar ao usuário o resultado de uma ação.

Loading

Skeleton

Success

Toast

Erro

Snackbar

Confirmação

Modal

---

# Layout

Todas as telas seguirão:

Header

↓

Conteúdo

↓

CTA Principal

↓

Safe Area

---

# Área de Toque

Mínimo

44x44

Ideal

48x48

---

# Dark Mode

Todos os componentes deverão ser preparados para:

Light

Dark

Mesmo que o Dark Mode seja lançado futuramente.

---

# Acessibilidade

Contraste mínimo WCAG AA

Fonte mínima

14

Ícones sempre acompanhados de texto quando necessário

Jamais utilizar apenas cor para transmitir informação.

---

# UX

Toda tela deverá responder três perguntas imediatamente.

Onde estou?

O que posso fazer?

Qual o próximo passo?

---

# Convenções

Nunca utilizar:

```tsx
backgroundColor:"#F472B6"
```

Sempre:

```tsx
colors.primary
```

Nunca utilizar:

```tsx
padding:18
```

Sempre:

```tsx
spacing.lg
```

Nunca utilizar:

```tsx
borderRadius:15
```

Sempre:

```tsx
radius.lg
```

---

# Objetivo Final

Quando um usuário abrir o Lunara pela primeira vez, deverá sentir que está utilizando um produto premium.

A experiência deverá transmitir:

- elegância;
- simplicidade;
- rapidez;
- organização;
- confiança.

O design não deve chamar atenção por excesso de elementos, mas pela qualidade dos detalhes e pela consistência entre todas as telas.