import DataNotFoundException from '#exceptions/data_not_found_exception'
import ForbiddenException from '#exceptions/forbidden_exception'
import ValidationException from '#exceptions/validation_exception'
import Action from '#models/action'
import { addActionValidator } from '#validators/action'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class ActionsController {
  async getActions({ response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('ActionPolicy').denies('view')) {
        throw new ForbiddenException()
      }

      const actionData = await db.rawQuery(
        `SELECT
          id,
          action_name,
          action_price
         FROM actions
         WHERE clinic_id = ?`,
        [auth.user!.clinicId]
      )

      return response.ok({
        message: 'Data fetched!',
        data: actionData[0],
      })
    } catch (error) {
      throw error
    }
  }

  async addAction({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('ActionPolicy').denies('create')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addActionValidator)

      const newAction = new Action()
      newAction.actionName = data.actionName
      newAction.actionPrice = data.actionPrice
      newAction.clinicId = auth.user!.clinicId

      await newAction.save()

      return response.created({
        message: 'Tindakan berhasil ditambahkan!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else {
        throw error
      }
    }
  }

  async updateAction({ request, response, params, bouncer }: HttpContext) {
    try {
      const actionData = await Action.findOrFail(params.id)

      if (await bouncer.with('ActionPolicy').denies('handle', actionData)) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(addActionValidator)

      actionData.actionName = data.actionName
      actionData.actionPrice = data.actionPrice

      await actionData.save()

      return response.ok({
        message: 'Data tindakan berhasil diubah!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data tindakan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async deleteAction({ response, params, bouncer }: HttpContext) {
    try {
      const actionData = await Action.findOrFail(params.id)

      if (await bouncer.with('ActionPolicy').denies('handle', actionData)) {
        throw new ForbiddenException()
      }

      await actionData.delete()

      return response.ok({
        message: 'Data tindakan berhasil dihapus!',
      })
    } catch (error) {
      if (error.status === 404) {
        throw new DataNotFoundException('Data tindakan tidak ditemukan!')
      } else {
        throw error
      }
    }
  }
}
