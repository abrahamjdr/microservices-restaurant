import { PlateReservationJob } from '@restaurant/shared-types';

export interface IQueueProducerPort {
  publishPlateReservation(job: PlateReservationJob): Promise<void>;
  getDepth(): Promise<number>;
}
