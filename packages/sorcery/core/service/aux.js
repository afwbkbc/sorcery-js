Sorcery.define([
  'class/service',
  'service/fs',
  'controller/*',
],function(Service,Fs){

  var controllers=[].splice.call(arguments,2);
  
  return Service.extend({

    update_cache : function() {
      var filedata='';
      
      var getcache = function(extensions) {
        if (typeof(extensions)==='string')
          extensions=[extensions];
        // parse bundles and generate path cache
        var pathcache={};
        var paths=Sorcery.get_require_paths();
        for (var i in paths) {
          var path=paths[i];
          var files=Fs.list_directory_recursive(path);
          for (var ii in files) {
            var f=files[ii].substring(path.length+1);
            if (f.length>3) {
              for (var iii in extensions) {
                var ext=extensions[iii];
                var ei=f.indexOf(ext);
                var fl=f.length;
                var el=ext.length;
                var flel=fl-el;
                if ((ei>=0)&&(ei===flel)) {
                  f=f.substring(0,flel);
                  if (typeof(pathcache[f])==='undefined')
                    pathcache[f]=path;
                }
              }
            }
          }
        }
        return pathcache;
      };
      
      var pathcache={
          js:getcache('.js'),
      };
      
      for (var i in Sorcery.template_engines)
        pathcache[i]=getcache(Sorcery.template_engines[i]);
      
      //console.log('PC',pathcache);
      
      filedata+='Sorcery.set_path_cache('+JSON.stringify(pathcache)+');';
      
      // other
      
      Fs.write_file('cache.js',filedata);
    },
    
    update_rewrites : function() {
      var routemasks=[];
      
      var pseudo_router={
        
        route : function(data) {
          var pattern=data.pattern;
          var pos;
          while ((pos=pattern.indexOf(':'))>=0) {
            var subpattern=pattern.substring(pos);
            var pos2=subpattern.indexOf('/');
            if (pos2>=0)
              subpattern=subpattern.substring(0,pos2);
            pattern=pattern.replace(subpattern,'([^/]+)');
          }
          routemasks.push(pattern);
        }
        
      };
      
      for (var i in controllers) {
        var c=controllers[i];
        if (c.class_name==='controller')
          c.register(pseudo_router);
      }
      
      var string='RewriteEngine on\n';
      for (var i in routemasks)
        string+='RewriteRule ^'+routemasks[i]+'$ sorcery.html [QSA,L]\n';
      
      Fs.write_file('./.htaccess',string);
    },
  
    maintain_cache : function() {
      
      this.paths=Sorcery.get_require_paths();
      
      var update_timeout=false;
      
      var need_rewrites=false;
      
      var self=this;
      var updatefunc=function(){
        self.update_cache();
        if (need_rewrites)
          self.update_rewrites();
        update_timeout=false;
        need_rewrites=false;
      };
      
      for (var i in this.paths) {
        var path=this.paths[i];
        var watcher=Fs.watch_directory(path);
        
        watcher.on('all',function(event,path){
          if ((path.indexOf('app/')===0)||(path.indexOf('packages/')===0)) {
            if (path.indexOf('/controller/')>=0)
              need_rewrites=true;
            if (update_timeout!==false)
              clearTimeout(update_timeout);
            update_timeout=setTimeout(updatefunc,100);
          }
        });
        
      }
      
    },
    
  });

});
