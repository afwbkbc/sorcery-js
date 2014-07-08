Sorcery.define([
  'class/service',
],function(Service){

  return Service.extend({
    
    fs : require('fs'),
    mkdirp : require('mkdirp'),
    path : require('path'),

    remove_file : function(path) {
      
      this.fs.unlinkSync(path);
      
    },
  
    copy_file : function(src,dest,callback) {
      
      var dirname=this.path.dirname;
      
      var self=this;
      this.mkdirp(dirname(dest),function(err){
        if (err) {
          throw new Error('unable to create directories');
        }
        var r=self.fs.createReadStream(src);
        var w=self.fs.createWriteStream(dest);
        w.on('close',function(){
          if (typeof(callback)==='function')
            callback();
        });
        r.pipe(w);
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
    
    write_file : function(path,contents,callback) {
      this.fs.writeFileSync(path,contents,'utf8');
      /*var stream = this.fs.createWriteStream(path);
      stream.once('open', function(fd) {
        stream.write(contents);
        stream.end();
        if (typeof(callback)==='function')
          callback();
      });*/
    },
    
  });
  
});