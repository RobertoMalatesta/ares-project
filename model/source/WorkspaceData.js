var AresStore = function(name) {
	this.name = name;
	var store = localStorage.getItem(this.name);
	this.data = (store && JSON.parse(store)) || {};
};
    
_.extend(AresStore.prototype, {

	strExclude: {originator: 1, service: 1, config: 1},
	stringifyReplacer: function(key, value) {
		// enyo.log("stringifyReplacer: " + key);
		if (this.strExclude[key] !== undefined) {
			// enyo.log("Excluding: " + key);
			return undefined;	// Exclude
		}
		return value;	// Accept
	},

	// Save the current state of the **Store** to *localStorage*.
	save: function() {
		try {
			enyo.log("Store.save: ", this.data);
			var projectString = JSON.stringify(this.data, enyo.bind(this, this.stringifyReplacer));
			localStorage.setItem(this.name, projectString);
			enyo.log("Store.save DONE: " + projectString);
		} catch(error) {
			enyo.log("Exception: ", error);
		}
	},
    
	// Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
	// have an id of it's own.
	create: function(model) {
		enyo.log("Store.create");
		if (!model.id) model.id = model.attributes.id = guid();
		this.data[model.id] = model;
		this.save();
		return model;
	},
    
	// Update a model by replacing its copy in `this.data`.
	update: function(model) {
		enyo.log("Store.update");
		this.data[model.id] = model;
		this.save();
		return model;
	},

	// Retrieve a model from `this.data` by id.
	find: function(model) {
		enyo.log("Store.find");
		return this.data[model.id];
	},
    
    // Return the array of all models currently in storage.
    findAll: function() {
		enyo.log("Store.findAll");
		return _.values(this.data);
    },

    // Delete a model from `this.data`, returning it.
    destroy: function(model) {
		enyo.log("Store.destroy");
		delete this.data[model.id];
		this.save();
		return model;
    }
  });

Backbone.sync = function(method, model, options) {

	var resp;
	var store = model.localStorage || model.collection.localStorage;

    switch (method) {
		case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
		case "create":  resp = store.create(model);                            break;
		case "update":  resp = store.update(model);                            break;
		case "delete":  resp = store.destroy(model);                           break;
	}

	if (resp) {
		options.success(resp);
	} else {
		options.error("Record not found");
	}
};

if ( ! Ares.Model) {
	Ares.Model = {};
}

Ares.Model.Project = Backbone.Model.extend({				// TODO: Move to enyo.Model when possible
	getName: function() {
		return this.get("id");
	},
	getServiceId: function() {
		return this.get("serviceId");
	},
	getFolderId: function() {
		return this.get("folderId");
	},
	getService: function() {
		return this.get("service");
	},
	setService: function(service) {
		return this.set("service", service);
	},
	getConfig: function() {
		return this.get("config");
	},
	setConfig: function(config) {
		return this.set("config", config);
	}
});

Ares.Model.PROJECTS_STORAGE_KEY = "com.enyojs.ares.projects";

Ares.Model.Projects = Backbone.Collection.extend({		// TODO: move to enyo.Collection when possible
	model: Ares.Model.Project,
	initiliaze: function() {
		enyo.log("Ares.Model.WorkspaceData.initialize()");
	},
	comparator: function(a, b) {
		var result;
		if (a.id > b.id) {
			result = 1;
		} else if (a.id < b.id) {
			result = -1;
		} else {
			result = 0;
		}
		enyo.log("comparator: " + a.id + " // " + b.id + " ==> " + result);
		return result;
	},
	createProject: function(name, folderId, serviceId) {
		var project = this.get(name);
		if (project !== undefined) {
			throw new Error("Already exist");
		} else {
			project = new this.model({id: name, folderId: folderId, serviceId: serviceId});
			this.add(project);
			project.save();
			return project;
		}
	},
	removeProject: function(name) {
		var project = this.get(name);
		if (project === undefined) {
			throw new Error("Project '" + name + "'Does not exist");
		} else {
			project.destroy();
		}
	}
});

// Create the workspace collection of projects and load the data from the local storage
Ares.WorkspaceData = new Ares.Model.Projects();
Ares.WorkspaceData.localStorage = Ares.Model.PROJECTS_STORAGE_KEY;
Ares.WorkspaceData.fetch();

