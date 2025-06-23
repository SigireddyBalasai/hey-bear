'use client';

import { useState } from 'react';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ImportResult {
  success: boolean;
  imported?: number;
  skipped?: number;
  errors?: string[];
  total?: number;
  error?: string;
}

export function ImportTwilioButton() {
  const [isImporting, setIsImporting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Call the API route via fetch and parse the result
      const response = await fetch('/admin/actions/import-twilio-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: ImportResult = await response.json();

      if (result.success) {
        setImportResult(result);
        setShowDialog(true);
      }
    } catch {
      setImportResult({
        success: false,
        error: 'An unexpected error occurred during import',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Button onClick={() => void handleImport()} disabled={isImporting} className="gap-2">
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {isImporting ? 'Importing...' : 'Import from Twilio'}
      </Button>

      {importResult && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => setShowDialog(true)}>
              View Last Import Results
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Results</DialogTitle>
              <DialogDescription>Summary of the last Twilio phone number import</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {importResult.success ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total numbers found:</span>
                    <span className="font-semibold">{importResult.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successfully imported:</span>
                    <span className="font-semibold text-green-600">{importResult.imported}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Skipped (already exist):</span>
                    <span className="font-semibold text-yellow-600">{importResult.skipped}</span>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-red-600">Errors:</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        {importResult.errors.map(error => (
                          <li key={error} className="text-red-600">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  <p className="font-semibold">Import Failed</p>
                  <p className="text-sm">{importResult.error}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
