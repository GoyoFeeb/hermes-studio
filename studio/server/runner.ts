/**
 * runner.ts — orquesta las 9 fases para un job, en el orden estricto que documenta
 * agents/00-orchestrator.md. Esta es la implementación real de "00" para este servicio: no es
 * una llamada a la IA (el orquestador no decide contenido, solo secuencia y gates), es control
 * de flujo directo. Ver el alcance v1 documentado en studio/README.md: si QA (08) devuelve
 * "Devuelto"/"Bloqueado" o el production gate (09) falla, el job termina bloqueado con el
 * motivo — no hay reintento automático a la fase responsable en esta versión.
 */
import * as path from 'path';
import * as fs from 'fs';
import { getJob, updateJob, appendEvent, type JobInput } from './store';
import { createCampaign, brandExists, slugify } from './campaignFs';
import { runTextPhase, type TextPhaseSpec } from './phases/textPhase';
import { PHASE_01, PHASE_03, PHASE_04, PHASE_05 } from './phases/specs';
import { runBrandPhase } from './phases/brandPhase';
import { runDataPhase } from './phases/dataPhase';
import { runBuildPhase } from './phases/buildPhase';
import { runQaPhase, runProductionGate, writeDeliveryNotes } from './phases/qaExportPhase';
import { ROOT } from './paths';

function log(jobId: string, phase: string, message: string, level: 'info' | 'error' | 'success' = 'info'): void {
  appendEvent(jobId, { phase, level, message });
}

export async function runJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job ${jobId} no encontrado`);

  updateJob(jobId, { status: 'running' });
  log(jobId, 'system', 'Trabajo iniciado.');

  const input: JobInput = job.input;
  const clientSlug = input.clientSlug;
  const brandSlug = clientSlug; // 1 marca = 1 slug de cliente, coherente con brands/{slug}/

  try {
    updateJob(jobId, { currentPhase: 'setup' });
    log(jobId, 'setup', 'Creando estructura de campaña...');
    const campaignSlug = `${new Date().toISOString().slice(0, 10)}-${slugify(input.briefText).slice(0, 30)}-${jobId.slice(-4)}`;
    const created = await createCampaign({
      clientSlug,
      clientName: input.clientName,
      campaignSlug,
      ctaLabel: input.ctaLabel,
      ctaUrl: input.ctaUrl,
    });
    updateJob(jobId, { campaignSlug, campaignRelPath: created.campaignRelPath });
    log(jobId, 'setup', `Campaña creada en ${created.campaignRelPath}`, 'success');

    const campaignRelPath = created.campaignRelPath;

    updateJob(jobId, { currentPhase: '01' });
    log(jobId, '01', 'Estructurando el brief...');
    await runTextPhase(PHASE_01, campaignRelPath, input);
    log(jobId, '01', 'Brief estructurado.', 'success');

    const openQuestionsPath = path.join(ROOT, campaignRelPath, '00-brief', 'open-questions.md');
    const openQuestions = fs.existsSync(openQuestionsPath) ? fs.readFileSync(openQuestionsPath, 'utf8') : '';
    if (/bloqueante/i.test(openQuestions)) {
      updateJob(jobId, {
        status: 'blocked',
        blockedReason:
          'El brief tiene preguntas bloqueantes sin resolver. Revisa ' +
          `${campaignRelPath}/00-brief/open-questions.md y vuelve a enviar el formulario con más detalle.`,
      });
      log(jobId, '01', 'Hay preguntas bloqueantes — se necesita más información del compañero.', 'error');
      return;
    }

    const needsBrandAnalysis = input.brandMode === 'new' || !brandExists(brandSlug);
    updateJob(jobId, { currentPhase: '02' });
    if (needsBrandAnalysis) {
      log(jobId, '02', 'Analizando la marca (navegando el sitio real)...');
      await runBrandPhase(campaignRelPath, brandSlug, input);
      log(jobId, '02', 'Brand pack generado.', 'success');
    } else {
      log(jobId, '02', 'Marca ya existente — reutilizando brand pack.', 'success');
    }

    const textPhases: Array<[string, TextPhaseSpec]> = [
      ['03', PHASE_03],
      ['04', PHASE_04],
      ['05', PHASE_05],
    ];
    for (const [phaseId, spec] of textPhases) {
      updateJob(jobId, { currentPhase: phaseId });
      log(jobId, phaseId, `Ejecutando fase ${phaseId} (${spec.label})...`);
      await runTextPhase(spec, campaignRelPath, input);
      log(jobId, phaseId, `Fase ${phaseId} completada.`, 'success');
    }

    updateJob(jobId, { currentPhase: '06' });
    log(jobId, '06', 'Ensamblando campaign-data.json...');
    await runDataPhase(campaignRelPath, campaignSlug, brandSlug, input);
    log(jobId, '06', 'campaign-data.json validado contra el schema.', 'success');

    updateJob(jobId, { currentPhase: '07' });
    log(jobId, '07', 'Construyendo el HTML con el motor...');
    const build = await runBuildPhase(campaignRelPath);
    if (!build.ok) {
      updateJob(jobId, { status: 'blocked', blockedReason: `El motor no pudo construir el HTML:\n${build.message}` });
      log(jobId, '07', build.message, 'error');
      return;
    }
    log(jobId, '07', 'Build OK.', 'success');

    updateJob(jobId, { currentPhase: '08' });
    log(jobId, '08', 'Renderizando y evaluando calidad (320/375/600/600-dark)...');
    const qa = await runQaPhase(campaignRelPath, brandSlug, input);
    log(
      jobId,
      '08',
      `Veredicto QA: ${qa.verdict}${qa.blockers.length ? ' — ' + qa.blockers.join('; ') : ''}`,
      qa.verdict === 'Aprobado' ? 'success' : 'error'
    );
    if (qa.verdict !== 'Aprobado') {
      updateJob(jobId, {
        status: 'blocked',
        blockedReason: `QA devolvió la campaña: ${qa.verdict}. Motivos: ${
          qa.blockers.join('; ') || `ver ${campaignRelPath}/08-qa/final-checklist.md`
        }`,
      });
      return;
    }

    updateJob(jobId, { currentPhase: '09' });
    log(jobId, '09', 'Corriendo el production gate...');
    const gate = await runProductionGate(campaignRelPath);
    writeDeliveryNotes(campaignRelPath, gate);

    if (!gate.ok) {
      updateJob(jobId, {
        status: 'blocked',
        blockedReason: `El production gate no pasó. Gates fallidos: ${
          gate.failedGates.join(', ') || 'ver el log completo de la fase 09'
        }.`,
      });
      log(jobId, '09', gate.output, 'error');
      return;
    }

    log(jobId, '09', 'Production gate OK.', 'success');
    updateJob(jobId, {
      status: 'completed',
      currentPhase: null,
      resultRelPath: path.join(campaignRelPath, '09-exports/final-inline.html'),
    });
    log(jobId, 'system', 'Newsletter lista para descargar.', 'success');
  } catch (err) {
    const message = (err as Error).message;
    updateJob(jobId, { status: 'failed', error: message });
    log(jobId, getJob(jobId)?.currentPhase || 'system', message, 'error');
  }
}
