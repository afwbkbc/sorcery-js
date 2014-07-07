Sorcery.define([
  'class/service',
  'service/fs',
  'service/cli',
  'controller/*',
],function(Service,Fs,Cli){

  var controllers=[].splice.call(arguments,3);
  
  return Service.extend({

    init_app : function(force) {
      
      var chk=Fs.list_directory('./app');
      if ((chk.length>0)&&!force) {
        return false;
      }
      
      var files=[
        'frontend.js',
        'backend.js',
        'controller/default.js',
        'view/default.js',
        'template/default.html',
      ];
      
      Cli.print('initializing default app/ structure...\n');
      
      var src='initskel/';
      var dst='app/';
      for (var i in files) {
        var f=files[i];
        var r=Sorcery.resolve_resource(src+f);
        if (r!==null) {
          Fs.copy_file(r,dst+f);
          Cli.print('\t'+dst+f+'\n');
        }
      }
      
      Cli.print('done\n');
      
      return true;
    },

    update_cache : function() {
      var filedata='';

      var resourcecache={};
      
      var getcache = function(extensions) {
        if (typeof(extensions)==='string')
          extensions=[extensions];
        // parse bundles and generate path cache
        var pathcache={};

        var paths=Sorcery.get_require_paths();
        var appstr='./app/';
        var packagestr='./packages/';
        var resourcestr='resource/';
        for (var i in paths) {
          var path=paths[i];
          var files=Fs.list_directory_recursive(path);
          for (var ii in files) {
            var f=files[ii].substring(path.length);
            if (f[0]==='/')
              f=f.substring(1);
            var fpath=path+f;
            var vendor,package,ipath,basedir;
            if (fpath.indexOf(appstr)===0) {
              vendor=null;
              package=null;
              ipath=fpath.substring(appstr.length);
            }
            else if (fpath.indexOf(packagestr)===0) {
              fpath=fpath.substring(packagestr.length);
              var pos=fpath.indexOf('/');
              if (pos<0)
                continue; // no vendor dir or package dir
              vendor=fpath.substring(0,pos);
              if (!vendor)
                continue; // something's wrong
              package=fpath.substring(pos+1);
              if (!package)
                continue; // something's wrong
              pos=package.indexOf('/');
              if (pos>=0) {
                ipath=package.substring(pos+1);
                package=package.substring(0,pos);
              }
              else {
                ipath='';
              }
            }
            else
              continue;
            var pos=ipath.indexOf('/');
            if (pos>=0)
              basedir=ipath.substring(0,pos);
            else basedir='';
            if (basedir==='resource') {
              if (f.indexOf(resourcestr)===0) {
                f=f.substring(resourcestr.length);
                if (typeof(resourcecache[f])==='undefined') {
                  resourcecache[f]=path+resourcestr;
                }
              }
            }
            else {
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
        }
        return pathcache;
      };
      
      var pathcache={
          js:getcache('.js'),
      };
      
      for (var i in Sorcery.template_engines)
        pathcache[i]=getcache(Sorcery.template_engines[i]);
      
      //console.log('PC',pathcache);
      
      filedata+='Sorcery.set_path_cache('+JSON.stringify(pathcache)+');Sorcery.set_resource_cache('+JSON.stringify(resourcecache)+');';
      
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
