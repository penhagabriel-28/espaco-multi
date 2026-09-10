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

