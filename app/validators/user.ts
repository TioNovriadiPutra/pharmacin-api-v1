import vine from '@vinejs/vine'

export const updateAdministratorValidator = vine.compile(
  vine.object({
    fullName: vine.string().alpha({
      allowSpaces: true,
    }),
    gender: vine.enum(['male', 'female']),
    phone: vine.string().mobile((_) => {
      return {
        locale: ['id-ID'],
        strictMode: false,
      }
    }),
    address: vine.string().optional(),
  })
)
