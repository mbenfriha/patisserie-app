import { defineConfig, services } from '@adonisjs/drive'
import env from '#start/env'

const driveConfig = defineConfig({
	default: env.get('DRIVE_DISK'),
	services: {
		// R2 private bucket (for order attachments, sensitive files)
		r2: services.s3({
			credentials: {
				accessKeyId: env.get('R2_KEY'),
				secretAccessKey: env.get('R2_SECRET'),
			},
			region: env.get('R2_REGION') || 'auto',
			bucket: env.get('R2_BUCKET'),
			endpoint: env.get('R2_ENDPOINT'),
			forcePathStyle: env.get('NODE_ENV') !== 'production', // MinIO needs this, R2 doesn't
			visibility: 'private',
		}),

		// R2 public bucket (for creation images, product photos, workshop images, logos)
		r2_public: services.s3({
			credentials: {
				accessKeyId: env.get('R2_KEY'),
				secretAccessKey: env.get('R2_SECRET'),
			},
			region: env.get('R2_REGION') || 'auto',
			bucket: env.get('R2_PUBLIC_BUCKET') || env.get('R2_BUCKET'),
			endpoint: env.get('R2_ENDPOINT'),
			forcePathStyle: env.get('NODE_ENV') !== 'production', // MinIO needs this, R2 doesn't
			visibility: 'public',
		}),
	},
})

export default driveConfig

declare module '@adonisjs/drive/types' {
	export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
