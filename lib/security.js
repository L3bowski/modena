function security() {

	function securizeApi(requiredPermission, errorCode, errorMessage) {
		errorCode = errorCode != undefined ? errorCode : 401;
		errorMessage = errorMessage != undefined ? errorMessage : 'You are not allowed to perform the requested operation';

		return function(req, res, next) {
			if (userHasPermission(req.user, requiredPermission)) {
				return next();
			}
			else {
				return res.status(errorCode).json(errorMessage);
			}
		};
	}

	function userHasPermission(user, permission) {
		return user && user.permissions.indexOf(permission) > -1;
	}

	return {
		securizeApi,
		userHasPermission
	};
}

module.exports = security();