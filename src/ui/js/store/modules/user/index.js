var Vue = require('vue');
var setup = require('../../setup.js');

var KEY_TOKEN = 'task-manager.token';
Vue.http.interceptors.push(function(request, next) {
	if (window.localStorage.getItem(KEY_TOKEN)) {
		request.headers.set('Authorization', 'Bearer ' + window.localStorage.getItem(KEY_TOKEN));
	}
	next();
});

module.exports = {
	namespaced: true,
	state: {
		token: window.localStorage.getItem(KEY_TOKEN),
		user: null,
		users: null,
		tasks: null,
		groupName: '',
		workingGroupName: null
	},
	getters: {
		token(state) {
			return state.token;
		},
		user(state) {
			return state.user;
		},
		users(state){
			return state.users;
		},
		tasks(state) {
			return state.tasks;
		}
	},
	actions: {
		async login(store, credentials) {
			try {
				let response = await Vue.http.post(setup.API + '/users/login', credentials);
				if (response.data.token) {
					store.commit('token', response.data.token);
					return true;
				}
				return false;
			} catch (e) {
				console.log('Login fail ' + e);
				return false;
			}
		},
		async signup(store, credentials) {
			try {
				let response = await Vue.http.post(setup.API + '/users/signup', credentials);
				if (response.data.token) {
					store.commit('token', response.data.token);
					return true;
				}
				return false;
			} catch (e) {
				console.log('Sign up fail ' + e);
				return false;
			}
		},
		async logout(store, token) {
			try {
				let response = await Vue.http.post(setup.API + '/users/logout', token);
				store.commit('token', null);
				if (response.data.err === 0) {
					return true;
				} else {
					return false;
				}
			} catch (e) {
				console.log('Logout fail ' + e);
				return false;
			}
		},
		deleteToken(store) {
			store.commit('token', null);
			return true;
		},
		async getUser(store) {
			try {
				console.log(store.state.token);
				let response = await Vue.http.get(setup.API + '/users/get', store.state.token);
				if (response.data.err === 0) {
					store.commit ('user', response.data.user);
					return response.data.user;
				}
				return null;
			} catch (e) {
				return null;
			}
		},
		async updateUser(store) {
			try {
				let response = await Vue.http.get(setup.API + '/users/info');
				if (response.data.err === 0) {
					store.commit('user', response.data.user);
					return true;
				} else {
					// TODO toast token expired
					store.commit('user', null);
					store.commit('token', null);
					return false;
				}
			} catch (e) {
				if (e.status === 401) {
					store.commit('user', null);
					store.commit('token', null);
				}
				// TODO toast network error
				return false;
			}
		},
		async sendGroup(store, groupInfo) {
			try {
				let response = await Vue.http.post(setup.API + '/groups/create', groupInfo);
				if (response.data.err === 0) {
					store.commit('user',response.data.user);
					return true;
				} else {
					return false;
				}
			} catch(e) {
				return false;
			}
		},
		async sendTask(store, taskInfo) {
			try {
				let response = await Vue.http.post(setup.API + '/tasks/create', taskInfo);
				if (response.data.err === 0) {
					store.commit('user', response.data.user);
					return true;
				} else {
					return false;
				}
			} catch(e) {
				return false;
			}
		},
		async getUsers(store,groupName) {
			try {
				let response = await Vue.http.post(setup.API + '/groups/users/get', groupName);
				if (response.data.err === 0) {
					store.commit ('users', response.data.users);
					return response.data.users;
				}
				return null;
			} catch (e) {
				return null;
			}
		},
		async updateTasksOnce(store, userInfo) {
			var taskInfo = {
				username: userInfo.username,
				groupName: userInfo.groupName
			};
			this.groupName = userInfo.groupName;

			let response = await Vue.http.post(setup.API + '/tasks/status/get', taskInfo);
			if (response.data.err === 0) {
				let response = await Vue.http.post(setup.API + '/tasks/get', taskInfo);
				store.commit ('tasks', response.data.tasks);
			} else {
				// TODO: TOAST
			}
		},
		async updateTasksContinue(store, userInfo) {
			var taskInfo = {
				username: userInfo.username,
				groupName: userInfo.groupName
			};
			console.log(taskInfo.groupName);
			console.log(userInfo.groupName);

			let response = await Vue.http.post(setup.API + '/tasks/status/get', taskInfo);
			if (response.data.err === 0) {
				let response = await Vue.http.post(setup.API + '/tasks/get', taskInfo);
				store.commit ('tasks', response.data.tasks);
			} else {
				// TODO: TOAST
			}

			setInterval( async function() {
				taskInfo.groupName = userInfo.groupName;
				console.log(userInfo.groupName);
				let response = await Vue.http.post(setup.API + '/tasks/status/get', taskInfo);
				if (response.data.err === 0) {
					if (response.data.tasksModified) {
						let response = await Vue.http.post(setup.API + '/tasks/get', taskInfo);
						store.commit ('tasks', response.data.tasks);
						console.log(response.data.tasks);
					}
				} else {
					// TODO: TOAST
				}
			}, 5000);
		},
	},
	mutations: {
		token(state, value) {
			if (value !== null) {
				window.localStorage.setItem(KEY_TOKEN, value);
				state.token = value;
			} else {
				window.localStorage.removeItem(KEY_TOKEN);
				state.token = undefined;
			}
		},
		user(state, value) {
			state.user = value;
		},
		users(state, value) {
			state.users = value;
		},
		tasks(state, value) {
			state.tasks = value;
		}
	}
};