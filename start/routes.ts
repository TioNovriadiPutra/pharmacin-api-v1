import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const DrugFactoriesController = () => import('#controllers/drug_factories_controller')
const DrugsController = () => import('#controllers/drugs_controller')
const TransactionsController = () => import('#controllers/transactions_controller')
const DrugStocksController = () => import('#controllers/drug_stocks_controller')
const PatientsController = () => import('#controllers/patients_controller')
const QueueController = () => import('#controllers/queues_controller')
const DoctorsController = () => import('#controllers/doctors_controller')
const UnitsController = () => import('#controllers/units_controller')
const OccupationsController = () => import('#controllers/occupations_controller')
const ClinicsController = () => import('#controllers/clinics_controller')
const SpecialitiesController = () => import('#controllers/doctor_specialists_controller')
const EmployeesController = () => import('#controllers/employees_controller')
const DoctorAssistantsController = () => import('#controllers/doctor_assistants_controller')

router.get('/', async () => {
  return {
    status: 'OK',
    message: 'Server Running',
  }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('/admin', [AuthController, 'registerAdmin'])
        router.post('/doctor', [AuthController, 'registerDoctor']).use(
          middleware.auth({
            guards: ['api'],
          })
        )
        router.post('/assistant', [AuthController, 'registerDoctorAssistant']).use(
          middleware.auth({
            guards: ['api'],
          })
        )
        router.post('/employee', [AuthController, 'registerEmployee']).use(
          middleware.auth({
            guards: ['api'],
          })
        )
        router.post('/administrator', [AuthController, 'registerAdministrator']).use(
          middleware.auth({
            guards: ['api'],
          })
        )
      })
      .prefix('/register')
    router.get('/logout', [AuthController, 'logout']).use(
      middleware.auth({
        guards: ['api'],
      })
    )
    router.post('/login/desktop', [AuthController, 'loginDesktop'])
    router.post('/login/mobile', [AuthController, 'loginMobile'])
  })
  .prefix('/auth')

router
  .group(() => {
    router.get('/profile', [UsersController, 'getUserProfile'])
    router
      .group(() => {
        router.get('/', [UsersController, 'getAdministrators'])
        router.get('/:id', [UsersController, 'getAdministratorDetail'])
        router.put('/:id', [UsersController, 'updateAdministrator'])
        router.delete('/:id', [UsersController, 'deleteAdministrator'])
      })
      .prefix('/administrator')
    router
      .group(() => {
        router.get('/', [EmployeesController, 'getEmployees'])
        router.get('/:id', [EmployeesController, 'getEmployeeDetail'])
        router.put('/:id', [EmployeesController, 'updateEmployee'])
        router.delete('/:id', [EmployeesController, 'deleteEmployee'])
      })
      .prefix('/employee')
    router
      .group(() => {
        router.get('/', [DoctorAssistantsController, 'getAssistants'])
        router.get('/:id', [DoctorAssistantsController, 'getAssistantDetail'])
        router.put('/:id', [DoctorAssistantsController, 'updateDoctorAssistant'])
        router.delete('/:id', [DoctorAssistantsController, 'deleteAssistant'])
      })
      .prefix('/assistant')
  })
  .prefix('/user')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [ClinicsController, 'getClinicDetail'])
    router.put('/', [ClinicsController, 'updateClinic'])
  })
  .prefix('/clinic')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [DrugFactoriesController, 'getFactories'])
    router.get('/partnership/:id', [DrugFactoriesController, 'getFactoryDetail'])
    router.post('/partnership', [DrugFactoriesController, 'addDrugFactory'])
    router.delete('/partnership/:id', [DrugFactoriesController, 'deleteFactory'])
  })
  .prefix('/drug-factory')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [DrugsController, 'getDrugs'])
    router.post('/', [DrugsController, 'addDrug'])
    router
      .group(() => {
        router.get('/', [DrugsController, 'getCategories'])
        router.post('/', [DrugsController, 'addDrugCategory'])
        router.get('/:id', [DrugsController, 'getCategoryDetail'])
        router.put('/:id', [DrugsController, 'updateDrugCategory'])
        router.delete('/:id', [DrugsController, 'deleteDrugCategory'])
      })
      .prefix('/category')
    router.get('/:id', [DrugsController, 'getDrugDetail'])
    router.put('/:id', [DrugsController, 'updateDrug'])
    router.delete('/:id', [DrugsController, 'deleteDrug'])
  })
  .prefix('/drug')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [TransactionsController, 'getPurchaseTransactions'])
        router.post('/', [TransactionsController, 'addPurchaseTransaction'])
        router.delete('/:id', [TransactionsController, 'deletePurchaseTransaction'])
      })
      .prefix('/purchase')
  })
  .prefix('/transaction')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [DrugStocksController, 'getStocks'])
  })
  .prefix('/stock')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [PatientsController, 'getPatients'])
    router.get('/queue', [PatientsController, 'getQueuingPatients'])
    router.post('/', [PatientsController, 'addPatient'])
    router.post('/queue/:id', [PatientsController, 'addPatientQueue'])
  })
  .prefix('/patient')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/consult-wait', [QueueController, 'getConsultWaitQueue'])
    router.get('/doctor/consult-wait', [QueueController, 'getDoctorConsultWaitQueue'])
    router.get('/doctor/consulting', [QueueController, 'getDoctorConsultingQueue'])
    router.get('/doctor/consulting/:id', [QueueController, 'getDoctorConsultingQueueDetail'])
    router.patch('/consult-wait/:id', [QueueController, 'changeStatusToConsultingQueue'])
    router.delete('/cancel/:id', [QueueController, 'cancelQueue'])
  })
  .prefix('/queue')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [DoctorsController, 'getDoctors'])
    router.get('/:id', [DoctorsController, 'getDoctorDetail'])
    router.put('/:id', [DoctorsController, 'updateDoctor'])
    router.delete('/:id', [DoctorsController, 'deleteDoctor'])
  })
  .prefix('/doctor')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [UnitsController, 'getUnits'])
    router.post('/', [UnitsController, 'addUnit'])
    router.put('/:id', [UnitsController, 'updateUnit'])
    router.delete('/:id', [UnitsController, 'deleteUnit'])
  })
  .prefix('/unit')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [OccupationsController, 'getOccupations'])
  })
  .prefix('/occupation')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

router
  .group(() => {
    router.get('/', [SpecialitiesController, 'getSpecialities'])
  })
  .prefix('/speciality')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
