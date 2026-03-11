export const policies = {
	OrderPolicy: () => import('#policies/order_policy'),
	ProductPolicy: () => import('#policies/product_policy'),
	CreationPolicy: () => import('#policies/creation_policy'),
	WorkshopPolicy: () => import('#policies/workshop_policy'),
	CategoryPolicy: () => import('#policies/category_policy'),
	NotificationPolicy: () => import('#policies/notification_policy'),
}
