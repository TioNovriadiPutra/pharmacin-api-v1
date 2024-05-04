import User from '#models/user'
import {
  loginValidator,
  registerDoctorAssistantValidator,
  registerDoctorValidator,
  registerEmployeeValidator,
  registerValidator,
} from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { Role } from '../enums/role_enum.js'
import Clinic from '#models/clinic'
import Profile from '#models/profile'
import { Gender } from '../enums/gender_enum.js'
import InvalidCredentialException from '#exceptions/invalid_credential_exception'
import ValidationException from '#exceptions/validation_exception'
import Doctor from '#models/doctor'
import ForbiddenException from '#exceptions/forbidden_exception'
import DoctorAssistant from '#models/doctor_assistant'
import DataNotFoundException from '#exceptions/data_not_found_exception'

export default class AuthController {
  async registerAdmin({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(registerValidator)

      const newClinic = new Clinic()
      newClinic.clinicName = data.clinicName
      newClinic.clinicPhone = data.clinicPhone

      const newUser = new User()
      newUser.email = data.email
      newUser.password = data.password
      newUser.roleId = Role['ADMIN']

      const newProfile = new Profile()
      newProfile.fullName = data.fullName
      newProfile.gender = data.gender as Gender
      newProfile.phone = data.phone

      await newClinic.related('users').save(newUser)
      await newUser.related('profile').save(newProfile)

      return response.created({
        message: 'Registrasi berhasil!',
      })
    } catch (error: any) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      }
    }
  }

  async registerDoctor({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('AuthPolicy').denies('handle')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(registerDoctorValidator)

      const newUser = new User()
      newUser.email = data.email
      newUser.password = data.password
      newUser.roleId = Role['DOCTOR']
      newUser.clinicId = auth.user!.clinicId

      const newProfile = new Profile()
      newProfile.fullName = data.fullName
      newProfile.gender = data.gender as Gender
      newProfile.phone = data.phone
      newProfile.address = data.address

      const newDoctor = new Doctor()
      newDoctor.specialityId = data.specialityId
      newDoctor.clinicId = auth.user!.clinicId

      await newUser.related('profile').save(newProfile)
      await newProfile.related('doctor').save(newDoctor)

      return response.created({
        message: 'Registrasi dokter berhasil!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else {
        throw error
      }
    }
  }

  async registerDoctorAssistant({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('AuthPolicy').denies('handle')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(registerDoctorAssistantValidator)

      const doctorData = await Doctor.findOrFail(data.doctorId)

      const newUser = new User()
      newUser.email = data.email
      newUser.password = data.password
      newUser.roleId = Role['DOCTOR_ASSISTANT']
      newUser.clinicId = auth.user!.clinicId

      const newProfile = new Profile()
      newProfile.fullName = data.fullName
      newProfile.gender = data.gender as Gender
      newProfile.phone = data.phone
      newProfile.address = data.address

      const newDoctorAssistant = new DoctorAssistant()
      newDoctorAssistant.doctorId = doctorData.id

      await newUser.related('profile').save(newProfile)
      await newProfile.related('doctorAssistant').save(newDoctorAssistant)

      return response.created({
        message: 'Registrasi asisten berhasil!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 404) {
        throw new DataNotFoundException('Data dokter tidak ditemukan!')
      } else {
        throw error
      }
    }
  }

  async registerEmployee({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('AuthPolicy').denies('handle')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(registerEmployeeValidator)

      const newUser = new User()
      newUser.email = data.email
      newUser.password = data.password
      newUser.roleId = Role['NURSE']
      newUser.clinicId = auth.user!.clinicId

      const newProfile = new Profile()
      newProfile.fullName = data.fullName
      newProfile.gender = data.gender as Gender
      newProfile.phone = data.phone
      newProfile.address = data.address

      await newUser.related('profile').save(newProfile)

      return response.created({
        message: 'Registrasi karyawan berhasil!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else {
        throw error
      }
    }
  }

  async registerAdministrator({ request, response, auth, bouncer }: HttpContext) {
    try {
      if (await bouncer.with('AuthPolicy').denies('handle')) {
        throw new ForbiddenException()
      }

      const data = await request.validateUsing(registerEmployeeValidator)

      const newUser = new User()
      newUser.email = data.email
      newUser.password = data.password
      newUser.roleId = Role['ADMINISTRATOR']
      newUser.clinicId = auth.user!.clinicId

      const newProfile = new Profile()
      newProfile.fullName = data.fullName
      newProfile.gender = data.gender as Gender
      newProfile.phone = data.phone
      newProfile.address = data.address

      await newUser.related('profile').save(newProfile)

      return response.created({
        message: 'Registrasi administrator berhasil!',
      })
    } catch (error) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else {
        throw error
      }
    }
  }

  async loginDesktop({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)

      const userData = await User.verifyCredentials(data.email, data.password)

      if (userData.roleId === Role['NURSE'] || userData.roleId === Role['DOCTOR_ASSISTANT']) {
        throw new ForbiddenException()
      }

      const paymentStatusData = await Clinic.query()
        .select('payment_status')
        .from('clinics')
        .where('id', userData.clinicId)
        .firstOrFail()

      const token = await User.authTokens.create(userData)

      return response.ok({
        message: 'Login berhasil',
        token,
        paymentStatus: paymentStatusData.paymentStatus,
        roleId: userData.roleId,
      })
    } catch (error: any) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 403) {
        throw error
      } else {
        throw new InvalidCredentialException()
      }
    }
  }

  async loginMobile({ request, response }: HttpContext) {
    try {
      const data = await request.validateUsing(loginValidator)

      const userData = await User.verifyCredentials(data.email, data.password)

      if (userData.roleId === Role['DOCTOR'] || userData.roleId === Role['ADMIN']) {
        throw new ForbiddenException()
      }

      const paymentStatusData = await Clinic.query()
        .select('payment_status')
        .from('clinics')
        .where('id', userData.clinicId)
        .firstOrFail()

      const token = await User.authTokens.create(userData)

      return response.ok({
        message: 'Login berhasil',
        token,
        paymentStatus: paymentStatusData.paymentStatus,
        roleId: userData.roleId,
      })
    } catch (error: any) {
      if (error.status === 422) {
        throw new ValidationException(error.messages)
      } else if (error.status === 403) {
        throw error
      } else {
        throw new InvalidCredentialException()
      }
    }
  }

  async logout({ response, auth }: HttpContext) {
    const token = await User.authTokens.all(auth.user!)

    await User.authTokens.delete(auth.user!, token[0].identifier)

    return response.ok({
      message: 'Logout berhasil!',
    })
  }
}
