import { request } from './apiClient';

// GET /api/categories/getAllCategories
export const getCategories  = ()            => request('/api/categories/getAllCategories');

// POST /api/categories/createCategorie
export const createCategory = (payload)     => request('/api/categories/createCategorie', payload, 'POST');

// PUT /api/categories/updateCategorie/:id
export const updateCategory = (id, payload) => request(`/api/categories/updateCategorie/${id}`, payload, 'PUT');

// DELETE /api/categories/deleteCategorie/:id
export const deleteCategory = (id)          => request(`/api/categories/deleteCategorie/${id}`, undefined, 'DELETE');

// PATCH /api/categories — toggle (updateCategorie with is_active)
export const toggleCategory = (id, is_active) => request(`/api/categories/updateCategorie/${id}`, { is_active }, 'PUT');

// GET /api/categories/getCategorieById/:id
export const getCategoryById = (id)         => request(`/api/categories/getCategorieById/${id}`);

// GET /api/categories/searchByName?name=
export const searchCategories = (name)      => request(`/api/categories/searchByName?name=${encodeURIComponent(name)}`);
