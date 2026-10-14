import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

/**
 * ExportButton — télécharge un export (CSV) et confirme par un toast.
 * @param {() => Promise<string>} onExport — renvoie le nom du fichier téléchargé
 * @param {string} [label='Exporter']
 */
export function ExportButton({ onExport, label = 'Exporter', className = '' }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const name = await onExport();
      toast.success('Export téléchargé', { description: name });
    } catch (err) {
      toast.error(err.message || "L'export a échoué");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" className={`rounded-xl ${className}`} onClick={handleClick} disabled={busy}>
      {busy ? <Spinner size="xs" className="mr-2" label="Export en cours…" /> : <Download className="mr-2 size-4" />}
      {label}
    </Button>
  );
}
