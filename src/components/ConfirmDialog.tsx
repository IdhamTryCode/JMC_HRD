"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type State = ConfirmOptions & { open: boolean };

const DEFAULT_STATE: State = {
  open: false,
  title: "Konfirmasi",
  message: "",
  confirmLabel: "Ya",
  cancelLabel: "Batal",
  danger: false,
};

/**
 * Hook pengganti window.confirm dengan MUI Dialog.
 *
 * Pemakaian:
 *   const { confirm, dialog } = useConfirm();
 *   if (await confirm({ message: "Hapus item?", danger: true })) { ... }
 *   return <>{dialog}{...rest}</>;
 */
export function useConfirm() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setState({ ...DEFAULT_STATE, ...opts, open: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const dialog = (
    <Dialog open={state.open} onClose={() => close(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontSize: 18, fontWeight: 600 }}>{state.title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ fontSize: 14 }}>{state.message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => close(false)} variant="text">
          {state.cancelLabel}
        </Button>
        <Button
          onClick={() => close(true)}
          variant="contained"
          color={state.danger ? "error" : "primary"}
          autoFocus
        >
          {state.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, dialog };
}
