var fs = require('fs');

module.exports = {

    dive: function(dir, opt, action, complete) {

        // default options
        var defaultOpt = {
            all: false,
            recursive: true,
            directories: false
        };

        // check args
        if (typeof opt == 'function') {
            if (typeof action == 'undefined')
                complete = function () {};
            else
                complete = action;

            action = opt;
            opt = { };
        } else if (typeof complete == 'undefined')
            complete = function () {};

        // Assert that dir is a string
        if (typeof dir != 'string')
            dir = process.cwd();

        opt.all = opt.all || defaultOpt.all;
        opt.recursive = opt.recursive || defaultOpt.recursive;
        opt.directories = opt.directories || defaultOpt.directories;

        function dive(dir) {
            // Read the directory
            fs.readdir(dir, function(err, list) {
                todo--;
                // Return the error if something went wrong
                if (err) return action(err);

                // For every file in the list
                list.forEach(function(file) {

                    if (opt.all || file[0] != '.') {
                        todo++;

                        // Full path of that file
                        var path = dir + '/' + file;
                        // Get the file's stats
                        fs.stat(path, function(err, stat) {
                            if (err) {
                                todo--;
                                 return action(err);
                            }

                            // If the file is a directory
                            if (stat) {
                                if (stat.isDirectory()) {
                                    // Call action if enabled for directories
                                    if (opt.directories)
                                        action(null, path, stat);

                                    // Dive into the directory
                                    if (opt.recursive) {
                                        dive(path);
                                    }
                                } else {
                                    // Call the action
                                    action(null, path, stat);

                                    if (!--todo)
                                        complete();
                                }
                            }
                        });
                    }
                });
                //empty directories
                if(!list.length && !todo) {
                    complete();
                }
            });
        }

        var todo = 1;
        dive(dir);
    }
};