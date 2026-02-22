import transmit from '@adonisjs/transmit/services/main'

transmit.authorize('users/:userId/notifications', ({ auth, params }) => {
	return auth.user?.id === params.userId
})
