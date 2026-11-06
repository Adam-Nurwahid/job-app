import { AppStatus } from '../types';
import { STATUS_LABEL } from '../utils';

export const StatusBadge = ({ status }: { status: AppStatus }) => (
  <span className={`badge badge-${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>
);

export const ErrorBox = ({ message }: { message: string }) =>
  message ? <div className="alert" role="alert">{message}</div> : null;
