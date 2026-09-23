import { request } from './apiClient';

const BASE = '/api/suppliers';

// GET /api/suppliers/getAllSupplier
export const getSuppliers = () => request(`${BASE}/getAllSupplier`);

// GET /api/suppliers/getActiveSuppliers
export const getActiveSuppliers = () => request(`${BASE}/getActiveSuppliers`);

// GET /api/suppliers/getSupplierById/:id
export const getSupplierById = (id) => request(`${BASE}/getSupplierById/${id}`);

// GET /api/suppliers/searchSuppliersByName?name=
export const searchSuppliers = (name) => request(`${BASE}/searchSuppliersByName?name=${encodeURIComponent(name)}`);

// POST /api/suppliers/addSuppliers
export const createSupplier = (payload) => request(`${BASE}/addSuppliers`, payload, 'POST');

// PUT /api/suppliers/updateSuppliers/:id
export const updateSupplier = (id, payload) => request(`${BASE}/updateSuppliers/${id}`, payload, 'PUT');

// DELETE /api/suppliers/deleteSuppliers/:id
export const deleteSupplier = (id) => request(`${BASE}/deleteSuppliers/${id}`, undefined, 'DELETE');

// PATCH /api/suppliers/updateSuppliersStatus/:id  → désactiver
export const deactivateSupplier = (id) => request(`${BASE}/updateSuppliersStatus/${id}`, undefined, 'PATCH');

// PATCH /api/suppliers/activatedSuppliersStatus/:id  → activer
export const activateSupplier = (id) => request(`${BASE}/activatedSuppliersStatus/${id}`, undefined, 'PATCH');

// Alias pratique toggle
export const toggleSupplier = (id, is_active) =>
  is_active ? activateSupplier(id) : deactivateSupplier(id);
