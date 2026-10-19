import { getInvoicePdfData } from '@/services/invoiceService';

const CONCURRENCY = 4;

/**
 * Charge les données PDF de plusieurs factures par petits lots pour ne pas
 * saturer l'API. L'ordre des résultats suit celui des identifiants.
 * @param {string[]} ids
 * @param {(done: number) => void} [onProgress]
 */
export async function loadInvoiceDocuments(ids, onProgress = () => {}) {
  const results = new Array(ids.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < ids.length) {
      const i = next++;
      results[i] = (await getInvoicePdfData(ids[i])).data;
      onProgress(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
  return results;
}
