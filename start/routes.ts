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
const ActionsController = () => import('#controllers/actions_controller')

router.get('/', async () => {
  return {
    status: 'OK',
    message: 'Server Running',
  }
})

// Auth Endpoint
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

// User Endpoint
router
  .group(() => {
    router.get('/profile', [UsersController, 'getUserProfile'])
    router
      .group(() => {
        router.get('/', [UsersController, 'getAdministrators'])
        router.put('/:id', [UsersController, 'updateAdministrator'])
        router.delete('/:id', [UsersController, 'deleteAdministrator'])
      })
      .prefix('/administrator')
    router
      .group(() => {
        router.get('/', [EmployeesController, 'getEmployees'])
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
    router.get('/:id', [UsersController, 'getUserDetail'])
  })
  .prefix('/user')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Clinic Endpoint
router
  .group(() => {
    router.get('/', [ClinicsController, 'getClinicDetail'])
    router.get('/report', [ClinicsController, 'getClinicDailyReport'])
    router.put('/', [ClinicsController, 'updateClinic'])
    router
      .group(() => {
        router.patch('/open', [ClinicsController, 'openCashier'])
        router.patch('/close', [ClinicsController, 'closeCashier'])
      })
      .prefix('/cashier')
  })
  .prefix('/clinic')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Drug Factory Endpoint
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

// Drug Endpoint
router
  .group(() => {
    router.get('/', [DrugsController, 'getDrugs'])
    router.get('/assessment', [DrugsController, 'getDrugsAssessment'])
    router.post('/', [DrugsController, 'addDrug'])
    router
      .group(() => {
        router.get('/', [DrugsController, 'getDrugCategories'])
        router.post('/', [DrugsController, 'addDrugCategory'])
        router.get('/:id', [DrugsController, 'getDrugCategoryDetail'])
        router.put('/:id', [DrugsController, 'updateDrugCategory'])
        router.delete('/:id', [DrugsController, 'deleteDrugCategory'])
      })
      .prefix('/category')
    router.get('/:id', [DrugsController, 'getDrugDetail'])
    router.put('/:id', [DrugsController, 'updateDrug'])
    router.delete('/:id', [DrugsController, 'deleteDrug'])
    router.get('/factory/:id', [DrugsController, 'getDrugByDrugFactory'])
  })
  .prefix('/drug')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Transaction Endpoint
router
  .group(() => {
    router
      .group(() => {
        router.get('/', [TransactionsController, 'getPurchaseTransactions'])
        router.get('/:id', [TransactionsController, 'getPurchaseTransactionDetail'])
        router.post('/', [TransactionsController, 'addPurchaseTransaction'])
      })
      .prefix('/purchase')
    router
      .group(() => {
        router.get('/:id', [TransactionsController, 'getSellingTransactionDetail'])
        router.get('/pharmacy/:id', [TransactionsController, 'getPharmacyTransactionDetail'])
        router.patch('/payment/:id', [TransactionsController, 'sellingTransactionPayment'])
        router.patch('/pharmacy/:id', [TransactionsController, 'pharmacyTransactionDrugDelivery'])
        router.delete('/cart/:id', [TransactionsController, 'deleteSellingShoppingCartItem'])
        router.delete('/cart/action/:id', [TransactionsController, 'deleteActionCartItem'])
      })
      .prefix('/selling')
  })
  .prefix('/transaction')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Stock Endpoint
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

// Patient Endpoint
router
  .group(() => {
    router.get('/', [PatientsController, 'getPatients'])
    router.post('/', [PatientsController, 'addPatient'])
    router.post('/queue/:id', [PatientsController, 'addPatientQueue'])
  })
  .prefix('/patient')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Queue Endpoint
router
  .group(() => {
    router.get('/consult-wait', [QueueController, 'getConsultWaitQueue']) // Doctor Assistant
    router.get('/doctor/consulting', [QueueController, 'getDoctorConsultingQueue']) // Doctor
    router.get('/payment', [QueueController, 'getPaymentQueue']) // Nurse
    router.get('/drug-pick-up', [QueueController, 'getDrugPickUpQueue']) // Nurse
    router.get('/doctor/consulting/:id', [QueueController, 'getDoctorConsultingQueueDetail']) // Doctor
    router.patch('/consult-wait/:id', [QueueController, 'changeStatusToConsultingQueue']) // Doctor Assistant
    router.delete('/cancel/:id', [QueueController, 'cancelQueue']) // Doctor Assistant
  })
  .prefix('/queue')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Doctor Endpoint
router
  .group(() => {
    router.get('/', [DoctorsController, 'getDoctors'])
    router.get('/:id', [DoctorsController, 'getDoctorDetail'])
    router.post('/assessment/:id', [DoctorsController, 'addAssessment'])
    router.put('/:id', [DoctorsController, 'updateDoctor'])
    router.delete('/:id', [DoctorsController, 'deleteDoctor'])
  })
  .prefix('/doctor')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )

// Unit Endpoint
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

// Occupation Endpoint
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

// Speciality Endpoint
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

// Action Endpoint
router
  .group(() => {
    router.get('/', [ActionsController, 'getActions'])
    router.post('/', [ActionsController, 'addAction'])
    router.get('/:id', [ActionsController, 'getActionDetail'])
    router.put('/:id', [ActionsController, 'updateAction'])
    router.delete('/:id', [ActionsController, 'deleteAction'])
  })
  .prefix('/action')
  .use(
    middleware.auth({
      guards: ['api'],
    })
  )
