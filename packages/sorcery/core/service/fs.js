Sorcery.define([
  'class/service',
],function(Service){

  return Service.extend({
    
    fs : require('fs'),
    
    list_directory : function(path) {
      return this.fs.readdirSync(path);
    },
    
    list_directory_recursive : function(path) {
      var self=this;
      var walk = function(dir) {
        var results = [];
        var list = self.fs.readdirSync(dir);
        list.forEach(function(file) {
            file = dir + '/' + file;
            var stat = self.fs.statSync(file);
            if (stat && stat.isDirectory()) results = results.concat(walk(file));
            else results.push(file);
        });
        return results;
      };
      return walk(path);
    },
    
    write_file : function(path,contents) {
      var stream = this.fs.createWriteStream(path);
      stream.once('open', function(fd) {
        stream.write(contents);
        stream.end();
      });
    },
    
  });
  
});