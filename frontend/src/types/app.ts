export type AppModalState =
  | {
      type: string;
      title?: string;
      data: any;
      msg?: string;
      onConfirm?: () => void;
      onCancel?: () => void;
    }
  | null;
