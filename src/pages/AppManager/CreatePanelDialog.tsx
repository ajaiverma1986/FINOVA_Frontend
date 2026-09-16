import type { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import '../Masters/MasterDataCrudPage.css';
import './CreatePanelDialog.css';

type Props = {
  create: boolean;
  view?: boolean;
  edit?: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function CreatePanelDialog({ create, view = false, edit = false, title, onClose, children }: Props) {
  if (!create && !view && !edit) return <>{children}</>;

  return (
    <Dialog
      open
      onClose={onClose}
      slotProps={{ paper: { 'aria-label': title } }}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <div className="master-data-page app-manager-create-dialog">
        {children}
      </div>
    </Dialog>
  );
}
