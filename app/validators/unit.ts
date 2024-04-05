import vine from '@vinejs/vine'

export const addUnitValidator = vine.compile(
  vine.object({
    unitName: vine.string(),
  })
)
