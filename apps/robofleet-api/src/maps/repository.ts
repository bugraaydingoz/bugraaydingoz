import { mapDefinitionSchema, type FleetMap } from "../contracts";
import type { createDatabase } from "../db";

export type Database = ReturnType<typeof createDatabase>;

export function createMapRepository(database: Database) {
  async function list(): Promise<FleetMap[]> {
    const rows =
      await database.client`select m.id, m.name, v.version, v.definition from maps m join map_versions v on v.map_id=m.id and v.version=m.active_version order by m.id`;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      version: row.version,
      definition: mapDefinitionSchema.parse(row.definition),
    }));
  }

  async function get(id: string, version?: number): Promise<FleetMap | undefined> {
    const rows =
      await database.client`select m.id, m.name, v.version, v.definition from maps m join map_versions v on v.map_id=m.id and v.version=coalesce(${version ?? null},m.active_version) where m.id=${id}`;
    const row = rows[0];

    return row
      ? {
          id: row.id,
          name: row.name,
          version: row.version,
          definition: mapDefinitionSchema.parse(row.definition),
        }
      : undefined;
  }

  return { list, get };
}
