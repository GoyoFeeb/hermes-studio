import { defineRailway, github, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const hermesStudioVolume = volume("hermes-studio-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "iad", sizeMB: 500 });
  const hermesStudio = service("hermes-studio", {
    source: github("Javifeebbo/hermes-studio", { branch: "main", checkSuites: false }),
    // Lo que antes decía railway.json: imagen desde studio/Dockerfile y hasta 3 reintentos si se cae.
    build: { builder: "DOCKERFILE", dockerfilePath: "studio/Dockerfile" },
    deploy: { restartPolicyMaxRetries: 3 }, // reintentar al fallar (ON_FAILURE) es lo que Railway hace por defecto
    replicas: { "iad": 1 },
    volumeMounts: { "/data": hermesStudioVolume },
  });

  // Mismo proyecto. No quitar hermes-studio: `railway config plan` tiene que añadir este servicio
  // y su volumen. El repo de Studio se deja como está (Javifeebbo/…, ya aplicado; GitHub redirige).
  // El servicio nuevo usa el nombre actual, que es el que resuelve la instalación de GitHub.
  const hermesWorkerVolume = volume("hermes-worker-volume", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "iad", sizeMB: 2048 });
  const hermesWorker = service("hermes-worker", {
    source: github("GoyoFeeb/hermes-studio", { branch: "main", checkSuites: false }),
    build: { builder: "DOCKERFILE", dockerfilePath: "studio/worker/Dockerfile" },
    deploy: { restartPolicyMaxRetries: 3 },
    healthcheck: "/heartbeat",
    replicas: { "iad": 1 },
    volumeMounts: { "/data": hermesWorkerVolume },
  });

  return project("striking-luck", {
    variables: { managed: false },
    resources: [hermesStudio, hermesStudioVolume, hermesWorker, hermesWorkerVolume],
  });
});
