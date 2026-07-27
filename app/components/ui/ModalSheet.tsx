"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ModalSheet({
  children,
  labelledBy,
  className = "",
  onClose,
}: {
  children: ReactNode;
  labelledBy: string;
  className?: string;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
      window.requestAnimationFrame(() => opener?.focus());
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="sheet-layer"
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <section className={`sheet ${className}`.trim()}>
        {children}
      </section>
    </dialog>
  );
}
