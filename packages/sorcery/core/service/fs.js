Sorcery.define([
  'class/service',
],function(Service){

  return Service.extend({
    
    fs : require('fs'),
    mkdirp : require('mkdirp'),
    path : require('path'),
    
    copy_file : function(src,dest) {
      
      var dirname=this.path.dirname;
      
      var self=this;
      this.mkdirp(dirname(dest),function(err){
        if (err) {
          throw new Error('unable to create directories');
        }
        var r=self.fs.createReadStream(src);
        var w=self.fs.createWriteStream(dest);
        r.pipe(w);
        console.log('DONE',src,dest);
      });
      
    },
    
    file_exists : function(path) {
      return this.fs.existsSync(path);
    },
    
    watch_directory : function(dir,options) {
      if (typeof(options)==='undefined')
        options={permanent:true};
      var chokidar=require('chokidar');
      var watcher=chokidar.watch(dir,options);
      return watcher;
    },
    
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