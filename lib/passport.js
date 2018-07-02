const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const tracer = require('./tracer');

const userPrefixSeparator = '||->';
let deserializers = {};

const configurePassport = (server) => {

	const userSerializer = function userSerializer(user, doneCallback) {
		const namespace = user._namespace;
		delete user._namespace;
		const serializedUserId = namespace + userPrefixSeparator + user.id;
		return doneCallback(null, serializedUserId);
	};
	
	const userDeserializer = function userDeserializer(serializedUserId, doneCallback) {
		const parts = serializedUserId.split(userPrefixSeparator);
		const namespace = parts[0];
		const userId = parts[1];
		return deserializers[namespace](userId)
		.then(user => {
			if (!user) {
				var error = {
					message: 'Incorrect username or password'
				};
				return doneCallback(error, null);
			}
			return doneCallback(null, user);
		});
	}

	passport.serializeUser(tracer.trace(userSerializer));
	passport.deserializeUser(tracer.trace(userDeserializer));
}

const getStrategyCreator = (namespace) => {
	if (namespace.indexOf(userPrefixSeparator) > -1) {
		tracer.error('Namespaces containing ' + userPrefixSeparator + ' are not valid');
		return;
	}
	
	return function createAuthenticationStrategy(handlers) {
		deserializers[namespace] = handlers.userDeserializer;

		const localStrategy = new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password'
		}, function (username, password, doneCallback) {
			return handlers.userAuthenticator(username, password)
			.then(user => {
				if (!user) {
					const error = {
						message: 'Incorrect username or password'
					};
					return doneCallback(error, null);
				}
				
				user._namespace = namespace;
				return doneCallback(null, user);
			});
		});

		passport.use(namespace, localStrategy);
	};
};

const getLogInMiddleware = (namespace) => {
	return function logInMiddleware(req, res, next) {

		function doneCallback(error, user, info) {
			if (error) {
				return res.status(401).json(error);
			}

			req.logIn(user, function (error) {
				if (error) {
					return res.send(error);
				}
				return next();
			});
		}

		passport.authenticate(namespace, doneCallback)(req, res, next);
	};
}

const logOutMiddleware = function logOutMiddleware(req, res, next) {
	delete req.session.passport;
	return next();
};

const getUserManagementUtils = namespace => {
	const userManagementUtils = {
		createStrategy: tracer.trace(getStrategyCreator(namespace)),
		logInMiddleware: tracer.trace(getLogInMiddleware(namespace)),
		logOutMiddleware: tracer.trace(logOutMiddleware)
	};
	return userManagementUtils;
};

module.exports = { configurePassport, getUserManagementUtils };
