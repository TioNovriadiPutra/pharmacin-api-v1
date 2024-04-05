import vine from '@vinejs/vine'

export const updateDoctorAssistantValidator = vine.compile(
  vine.object({
    fullName: vine.string(),
    gender: vine.enum(['male', 'female']),
    phone: vine.string().mobile((_) => {
      return {
        locale: ['id-ID'],
        strictMode: false,
      }
    }),
    address: vine.string().optional(),
    doctorId: vine.number(),
  })
)
