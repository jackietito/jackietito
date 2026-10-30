import { prisma } from "./db";
import { aFechaCalendario, desdeISO } from "./fechas";

export const CLAVE_FECHA_SIMULADA = "fechaSimulada";

/**
 * Fecha "actual" del prototipo: la fecha simulada por el administrador
 * o, si no hay ninguna, la fecha real en Lima.
 */
export async function obtenerHoy(): Promise<Date> {
  const simulada = await obtenerFechaSimulada();
  return simulada ?? aFechaCalendario(new Date());
}

export async function obtenerFechaSimulada(): Promise<Date | null> {
  const conf = await prisma.configuracion.findUnique({ where: { clave: CLAVE_FECHA_SIMULADA } });
  return desdeISO(conf?.valor);
}
