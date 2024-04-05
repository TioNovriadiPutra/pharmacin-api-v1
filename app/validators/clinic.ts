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
  })
)

export const updateAdminFeeValidator = vine.compile(
  vine.object({
    outpatientFee: vine.number().positive(),
    sellingFee: vine.number().positive(),
  })
)
