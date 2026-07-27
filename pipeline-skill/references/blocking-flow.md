# Blocking/Unblocking Flow

## When a campaign is blocked

A campaign is set to `blocked` when essential information is missing. The **phase stays as-is** (e.g. a blocked briefing stays at phase `briefing`, not a separate "blocked" phase). The state `blocked` means the pipeline cannot advance, but the current phase records what work is pending.

The blocking agent must:

1. Register every missing piece as a structured question in `00-brief/open-questions.md`
2. Set `campaign-status.md` to `blocked` (state column) while keeping the phase column at the current phase
3. Add a task-log entry recording the blocking event
4. Pause the handoff — set To to "(Pausado — pendiente de inputs del usuario)"
5. Update next-steps.md with the exact information needed to unblock

## Question format (Q-NNN)

Each open question follows this structure:

```
### [Q-001] — Título claro de lo que falta

**Pregunta:** [Texto concreto y accionable que el usuario debe responder]

**Contexto:** [Por qué es necesaria esta información, qué fase/s agente/s dependen de ella]

**Impacto:** [Alto / Medio / Bajo]

**Destinatario:** [Usuario / Cliente / Agente posterior]
```

## Resolved format

Once answered, the question is marked:

```
### [Q-001] — Título

**Pregunta:** [original]

**Respuesta recibida:** [texto de la respuesta]

**Estado:** Resuelta
```

If the answer was partial or unresolved:

```
**Estado:** Parcial — [explicar qué parte sigue pendiente]
```

## 8 standard briefing questions

When a campaign arrives at agent 01 with no inputs at all, these 8 questions cover the critical and non-critical gaps:

| Q | Topic | Critical? |
|---|---|---|
| Q-001 | Campaign objective | Yes |
| Q-002 | CTA principal text | Yes |
| Q-003 | Main URL | Yes |
| Q-004 | Offer/promotion/message | Yes |
| Q-005 | Legal texts or "no aplica" | Yes |
| Q-006 | Visual references (landings, captures, brand guide) | No (medium) |
| Q-007 | Desired modules / structure | No (medium) |
| Q-008 | Brand/design/tone restrictions | No (medium) |

## Unblocking

When inputs arrive:

1. Process inputs and update phase deliverables (brief.md, requirements.md, source-links.md)
2. Mark resolved questions in open-questions.md
3. If critical gaps remain -> stay blocked
4. If resolved -> change campaign-status.md to next phase (analysis)
5. Sync all 4 control files
6. Prepare handoff to next agent
