import { Op } from "sequelize";
import { BlueprintPageModel } from "../postgres/database";
import { BlueprintPageInstance } from "../postgres/models/BlueprintPage";
import { BlueprintPage } from "../types";

const mapBlueprintPageEntityToObject = (entity: BlueprintPageInstance): BlueprintPage => ({
  id: entity.id,
  blueprint_id: entity.blueprint_id ?? null,
  blueprint_book_id: entity.blueprint_book_id ?? null,
  title: entity.title,
  description_markdown: entity.description_markdown,
  created_at: entity.created_at && entity.created_at.getTime() / 1000,
  updated_at: entity.updated_at && entity.updated_at.getTime() / 1000,
  factorioprints_id: entity.factorioprints_id ?? null,
});

export async function getBlueprintPageById(id: string): Promise<BlueprintPage | null> {
  const result = await BlueprintPageModel()
    .findByPk(id)
    .catch(() => null);
  return result ? mapBlueprintPageEntityToObject(result) : null;
}

export async function getBlueprintPageByFactorioprintsId(
  id: string
): Promise<BlueprintPage | null> {
  const result = await BlueprintPageModel()
    .findOne({
      where: { factorioprints_id: id },
    })
    .catch(() => null);
  return result ? mapBlueprintPageEntityToObject(result) : null;
}

export async function getMostRecentBlueprintPages({
  page = 1,
  perPage = 10,
  query,
}: {
  page: number;
  perPage: number;
  query?: string;
}): Promise<{ count: number; rows: BlueprintPage[] }> {
  const result = await BlueprintPageModel()
    .findAndCountAll({
      where: query ? { title: { [Op.iLike]: `%${query}%` } } : undefined,
      order: [["updated_at", "DESC"]],
      limit: perPage,
      offset: (page - 1) * perPage,
      raw: true,
    })
    .catch(() => null);

  return {
    count: result?.count ?? 0,
    rows: result?.rows.map(mapBlueprintPageEntityToObject) ?? [],
  };
}

export async function createBlueprintPage(
  type: "blueprint" | "blueprint_book",
  targetId: string,
  extraInfo: {
    title: string;
    user_id: string | null;
    description_markdown: string;
    created_at?: number;
    updated_at?: number;
    factorioprints_id?: string;
  }
) {
  const page = await BlueprintPageModel().create({
    user_id: extraInfo.user_id,
    title: extraInfo.title,
    description_markdown: extraInfo.description_markdown,
    factorioprints_id: extraInfo.factorioprints_id,
    blueprint_id: type === "blueprint" ? targetId : undefined,
    blueprint_book_id: type === "blueprint_book" ? targetId : undefined,
    updated_at: extraInfo.updated_at ? new Date(extraInfo.updated_at * 1000) : undefined,
    created_at: extraInfo.created_at ? new Date(extraInfo.created_at * 1000) : undefined,
  });

  console.log(`Created Blueprint Page`);
  return page;
}
