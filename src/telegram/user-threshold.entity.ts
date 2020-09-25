import { Column,Entity, PrimaryColumn } from 'typeorm';

@Entity('user_threshold')
export class UserThresholdEntity {
  @PrimaryColumn()
  userTelegramId: number;

  @Column({ nullable: true, type: 'double' })
  threshold: number;

  @Column({ name: 'is_notified', default: false })
  isNotified: boolean;
}
