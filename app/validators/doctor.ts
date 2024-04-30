import vine from '@vinejs/vine'

export const updateDoctorValidator = vine.compile(
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
    specialityId: vine.number(),
    address: vine.string().optional(),
  })
)

export const addAssessmentValidator = vine.compile(
  vine.object({
    weight: vine.number().optional(),
    height: vine.number().optional(),
    temperature: vine.number().optional(),
    bloodPressure: vine.number().optional(),
    pulse: vine.number().optional(),
    subjective: vine.string().optional(),
    assessment: vine.string().optional(),
    objective: vine.string().optional(),
    plan: vine.string().optional(),
    drugCarts: vine.array(
      vine.object({
        drugId: vine.number(),
        instruction: vine.string(),
        quantity: vine.number(),
        totalPrice: vine.number(),
      })
    ),
    actions: vine.array(vine.number()),
  })
)
