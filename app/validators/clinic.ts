import vine from '@vinejs/vine'

export const updateClinicValidator = vine.compile(
  vine.object({
    clinicName: vine.string(),
    address: vine.string().optional(),
    clinicPhone: vine.string().mobile((_) => {
      return {
        locale: ['id-ID'],
        strictMode: false,
      }
    }),
    outpatientFee: vine.number().positive(),
    sellingFee: vine.number().positive(),
  })
)
