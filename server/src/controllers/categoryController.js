const roomService = require('../services/room.service');
const { DEFAULT_RESIDENCY_ID } = require('../services/datastore');

async function getCategories(req, res, next) {
  try {
    const residencyId = req.profile?.residency_id || DEFAULT_RESIDENCY_ID;
    const categories = await roomService.getCategories(residencyId);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const residencyId = req.profile?.residency_id || DEFAULT_RESIDENCY_ID;
    const { name, description, max_persons, price_per_24_hours, amenities } = req.body;
    const category = await roomService.createCategory({
      residencyId,
      name,
      base_price: price_per_24_hours,
      max_occupancy: max_persons,
    });
    if (description) category.description = description;
    if (amenities) category.amenities = amenities;
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const residencyId = req.profile?.residency_id || DEFAULT_RESIDENCY_ID;
    const { id } = req.params;
    const { name, description, max_persons, price_per_24_hours, amenities, is_active } = req.body;
    const category = await roomService.updateCategory({
      residencyId,
      id,
      name,
      base_price: price_per_24_hours,
      max_occupancy: max_persons,
    });
    if (description !== undefined) category.description = description;
    if (amenities !== undefined) category.amenities = amenities;
    if (is_active !== undefined) category.is_active = Boolean(is_active);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const residencyId = req.profile?.residency_id || DEFAULT_RESIDENCY_ID;
    const { id } = req.params;
    const result = await roomService.deleteCategory({ residencyId, id });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
