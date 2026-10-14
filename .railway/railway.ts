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

  return project("striking-luck", {
    variables: { managed: false },
    resources: [hermesStudio, hermesStudioVolume],
  });
});
