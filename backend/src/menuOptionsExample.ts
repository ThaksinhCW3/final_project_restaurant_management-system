import { eq } from 'drizzle-orm';
import { db, pool } from './db/index';
import { attributes, attributeTypes, menuAttributes } from './db/schema';

async function createMenuOptions(menuId: number) {
  const sizeType = await db
    .insert(attributeTypes)
    .values({
      typeName: 'Size',
      selectionType: 'single',
      required: 1,
    })
    .$returningId();

  const addOnType = await db
    .insert(attributeTypes)
    .values({
      typeName: 'Add-ons',
      selectionType: 'multiple',
      required: 0,
    })
    .$returningId();

  const sizeAttributes = await db
    .insert(attributes)
    .values([
      {
        attributeTypeId: sizeType[0].attributeTypeId,
        attributeName: 'Small',
        priceDelta: '0.00',
      },
      {
        attributeTypeId: sizeType[0].attributeTypeId,
        attributeName: 'Large',
        priceDelta: '5000.00',
      },
    ])
    .$returningId();

  const addOnAttributes = await db
    .insert(attributes)
    .values([
      {
        attributeTypeId: addOnType[0].attributeTypeId,
        attributeName: 'Cheese',
        priceDelta: '2000.00',
      },
      {
        attributeTypeId: addOnType[0].attributeTypeId,
        attributeName: 'Egg',
        priceDelta: '3000.00',
      },
    ])
    .$returningId();

  await db.insert(menuAttributes).values([
    ...sizeAttributes.map((attribute) => ({
      menuId,
      attributeId: attribute.attributeId,
    })),
    ...addOnAttributes.map((attribute) => ({
      menuId,
      attributeId: attribute.attributeId,
    })),
  ]);
}

async function getMenuOptions(menuId: number) {
  const rows = await db
    .select({
      attributeTypeId: attributeTypes.attributeTypeId,
      typeName: attributeTypes.typeName,
      selectionType: attributeTypes.selectionType,
      required: attributeTypes.required,
      attributeId: attributes.attributeId,
      attributeName: attributes.attributeName,
      priceDelta: attributes.priceDelta,
    })
    .from(menuAttributes)
    .innerJoin(attributes, eq(menuAttributes.attributeId, attributes.attributeId))
    .innerJoin(attributeTypes, eq(attributes.attributeTypeId, attributeTypes.attributeTypeId))
    .where(eq(menuAttributes.menuId, menuId));

  return Object.values(
    rows.reduce((groups, row) => {
      groups[row.attributeTypeId] ??= {
        attributeTypeId: row.attributeTypeId,
        typeName: row.typeName,
        selectionType: row.selectionType,
        required: row.required,
        attributes: [],
      };

      groups[row.attributeTypeId].attributes.push({
        attributeId: row.attributeId,
        attributeName: row.attributeName,
        priceDelta: row.priceDelta,
      });

      return groups;
    }, {} as Record<number, {
      attributeTypeId: number;
      typeName: string;
      selectionType: 'single' | 'multiple';
      required: number | null;
      attributes: {
        attributeId: number;
        attributeName: string;
        priceDelta: string | null;
      }[];
    }>)
  );
}

async function main() {
  const menuId = 1;

  await createMenuOptions(menuId);
  const options = await getMenuOptions(menuId);

  console.log(JSON.stringify({ menuId, options }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
