import vine from '@vinejs/vine'

export const addDrugCategoryValidator = vine.compile(
  vine.object({
    categoryName: vine.string(),
  })
)

export const addDrugValidator = vine.compile(
  vine.object({
    drug: vine.string(),
    drugGenericName: vine.string().optional(),
    composition: vine.number(),
    unitId: vine.number(),
    categoryId: vine.number(),
    shelve: vine.number().optional(),
    factoryId: vine.number(),
    purchasePrice: vine.number().min(1),
    sellingPrice: vine.number().min(1),
  })
)
