import { Router } from 'express'
import { KnowledgeController } from '../controllers/knowledge.controller'

const router = Router()
const controller = new KnowledgeController()

router.get('/get-category-tree/:sourceLanguage', (req, res) =>
    controller.getCategoryTree(req, res)
)
router.get(
    '/get-category-items/:categoryId/:sourceLanguage/:translationLanguage/:page/:pageSize',
    (req, res) => controller.getCategoryItems(req, res)
)
router.get('/get-item/:itemId/:sourceLanguage', (req, res) =>
    controller.getItem(req, res)
)

router.get(
    '/get-subcategory-items/:subCategoryId/:sourceLanguage/:translationLanguage/:page/:pageSize',
    (req, res) => controller.getSubcategoryItems(req, res)
)

export default router
