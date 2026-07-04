import { useEffect, useCallback } from 'react';
import type { FormInstance } from 'antd';

const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export function useFormDraft<T = any>(form: FormInstance, storageKey: string, extraData?: T, setExtraData?: (data: T) => void) {
  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < EXPIRY_MS) {
          if (parsed.values) form.setFieldsValue(parsed.values);
          if (parsed.extra && setExtraData) setExtraData(parsed.extra);
        } else {
          localStorage.removeItem(storageKey); // expired
        }
      }
    } catch (e) {
      console.warn('Failed to restore form draft', e);
    }
  }, [form, storageKey]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    try {
      const values = form.getFieldsValue(true);
      localStorage.setItem(storageKey, JSON.stringify({
        timestamp: Date.now(),
        values,
        extra: extraData
      }));
    } catch (e) {
      console.warn('Failed to save form draft', e);
    }
  }, [form, storageKey, extraData]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to clear form draft', e);
    }
  }, [storageKey]);

  return { saveDraft, clearDraft };
}
