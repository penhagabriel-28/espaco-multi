/**
 * Mapeamento padrão de salas por profissional
 */
export const DEFAULT_PROFESSIONAL_ROOMS: Record<string, string> = {
  naianny: "Sala 6",
  gabriela: "Sala 2",
  joana: "Sala 7",
  leandro: "Sala 5",
  rayelle: "Sala 7",
  sther: "Sala 6",
  acioniza: "Sala 9",
  cleide: "Sala 3",
  tainara: "Sala 4",
  katia: "Sala 2",
  sonileny: "Sala 5",
};

/**
 * Normaliza strings para comparação (remove acentos, espaços extras e converte para minúsculas)
 */
export function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Retorna o nome da sala padrão para um profissional com base no nome
 */
export function getDefaultRoomNameForProfessional(profName?: string | null): string | null {
  if (!profName) return null;
  const norm = normalizeName(profName);
  for (const [key, roomName] of Object.entries(DEFAULT_PROFESSIONAL_ROOMS)) {
    if (norm.includes(key)) {
      return roomName;
    }
  }
  return null;
}

/**
 * Retorna o ID da sala padrão para um profissional
 */
export function getDefaultRoomIdForProfessional(
  profOrId: any,
  profissionaisList: any[] = [],
  salasList: any[] = []
): string | null {
  if (!profOrId || !Array.isArray(salasList) || salasList.length === 0) return null;

  let profName = "";
  if (typeof profOrId === "string") {
    const prof = Array.isArray(profissionaisList)
      ? profissionaisList.find((p) => p.id === profOrId)
      : undefined;
    profName = prof?.nome || profOrId;
  } else if (typeof profOrId === "object" && profOrId?.nome) {
    profName = profOrId.nome;
  }

  const roomName = getDefaultRoomNameForProfessional(profName);
  if (!roomName) return null;

  const normTarget = normalizeName(roomName);
  const targetNumber = roomName.replace(/\D/g, "");

  const matchedSala = salasList.find((s) => {
    const sNorm = normalizeName(s.nome);
    if (sNorm === normTarget) return true;
    if (sNorm.includes(normTarget)) return true;
    if (targetNumber && (sNorm === `sala ${targetNumber}` || sNorm === targetNumber)) return true;
    return false;
  });

  return matchedSala?.id || null;
}

/**
 * Verifica se uma sala é a sala padrão para o profissional fornecido
 */
export function isDefaultRoomForProfessional(
  profOrId: any,
  salaId: string,
  profissionaisList: any[] = [],
  salasList: any[] = []
): boolean {
  if (!salaId) return false;
  const defaultId = getDefaultRoomIdForProfessional(profOrId, profissionaisList, salasList);
  return !!defaultId && defaultId === salaId;
}
