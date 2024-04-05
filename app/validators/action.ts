import vine from '@vinejs/vine'

export const addActionValidator = vine.compile(
  vine.object({
    actionName: vine.string(),
    actionPrice: vine.number().positive(),
  })
)
