import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isProfissionalAdmin(p: any): boolean {
  if (!p) return false;
  if (p.tipo === "administrativo" || p.tipo === "admin") return true;
  if (p.valores_config && typeof p.valores_config === "object") {
    const config = p.valores_config as any;
    if (config.tipo === "administrativo" || config.tipo === "admin") return true;
  }
  return false;
}

export function isProfissionalClinico(p: any): boolean {
  return !isProfissionalAdmin(p);
}

export function isProfActiveInPeriod(
  p: any,
  startDateStr?: string,
  endDateStr?: string,
  allowAdmin = false
): boolean {
  if (!p) return false;
  if (!allowAdmin && isProfissionalAdmin(p)) return false;

  const config = (p.valores_config || {}) as any;
  const ativoAte = config.ativo_ate || p.ativo_ate;
  const ativoDesde = config.ativo_desde || p.ativo_desde;

  const targetStartMonth = startDateStr ? startDateStr.substring(0, 7) : "";
  const targetEndMonth = endDateStr ? endDateStr.substring(0, 7) : targetStartMonth;

  // If there is an end date (ativo_ate), check if the period is strictly after the active date
  if (ativoAte) {
    if (targetStartMonth && targetStartMonth > ativoAte) {
      return false;
    }
  } else if (p.ativo === false) {
    // If no ativo_ate is defined and p.ativo is false, they are deactivated
    return false;
  }

  // If there is a start date (ativo_desde), check if the period is strictly before the start date
  if (ativoDesde) {
    if (targetEndMonth && targetEndMonth < ativoDesde) {
      return false;
    }
  }

  return true;
}


