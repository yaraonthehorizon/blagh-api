import { Router } from 'express'
import { QuranController } from '../controllers/quran.controller'

const router = Router()
const controller = new QuranController()

router.get('/recitation/get-categories/:locale', (req, res) =>
    controller.getCategories(req, res)
)
router.get('/recitation/get-category/:id/:locale', (req, res) =>
    controller.getCategory(req, res)
)
router.get(
    '/recitation/get-reciters-and-associated-recitations/:id/:locale',
    (req, res) => controller.getRecitersAndAssociatedRecitations(req, res)
)
router.get('/recitation/get-recitation/:id/:locale', (req, res) =>
    controller.getRecitationInfo(req, res)
)

export default router
