Sorcery.define([
  'class/service',
  'service/fs',
  'service/cli',
],function(Service,Fs,Cli){

  return Service.extend({

    init_app : Sorcery.method(function(force) {
      
      var sid=Sorcery.begin();
      
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
        'style/default.css',
      ];
      
      Cli.print('initializing default app/ structure...\n');
      
      var src='initskel/';
      var dst='app/';
      
      for (var i in files) {
        var f=files[i];
        var r=Sorcery.resolve_resource(src+f);
        if (r!==null) {
          Cli.print('\t'+dst+f+'\n');
          Fs.copy_file(r,dst+f);
        }
      }
      
      Cli.print('done\n');
      
      return Sorcery.end(sid,null);
    }),

    reload_cache : function() {
      var data=Fs.read_file('./cache.js');
      if (data)
        eval(data);
    },

    update_cache : function() {
      
      Cli.print('updating cache...');
      
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
        pathcache['template/'+i]=getcache(Sorcery.template_engines[i]);
      
      for (var i in Sorcery.style_engines)
        pathcache['style/'+i]=getcache(Sorcery.style_engines[i]);
      
      for (var i in Sorcery.compilers) {
        compiler=Sorcery.compilers[i];
        compiled=getcache(compiler.source);
        var pck=compiler.type+'/'+compiler.engine;
        for (var ii in compiled)
          if (typeof(pathcache[pck][ii])==='undefined')
            pathcache[pck][ii]=compiled[ii].replace(/\.\//,'./compiled/');
      }
      
      filedata+='Sorcery.set_path_cache('+JSON.stringify(pathcache)+');Sorcery.set_resource_cache('+JSON.stringify(resourcecache)+');';
      
      // other
      Fs.write_file('cache.js',filedata);
      
      Cli.print('done\n');
    },
    
    update_rewrites : function() {
      
      Cli.print('updating rewrites...');
      
      Sorcery.require([
        'controller/*',
      ],function(){
      
        var controllers=arguments;
      
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

        Cli.print('done\n');
        
      });
    },
  
    maintain_cache : function() {
      
      //this.paths=Sorcery.get_require_paths();
      
      var update_timeout=false;
      
      var need_rewrites=false;
      
      var self=this;
      var updatefunc=function(){
        self.update_cache();
        self.reload_cache();
        if (need_rewrites)
          self.update_rewrites();
        update_timeout=false;
        need_rewrites=false;
      };
      
      var get_compiler=function(extension){
        //console.log('ISC',path,Sorcery.compilers);
        
        for (var i in Sorcery.compilers) {
          var compiler=Sorcery.compilers[i];
          if (compiler.source===extension) {
            compiler.name=i;
            return compiler;
          }
        }
        
        return null;
      };
      
      //console.log('P',this.paths);
      //for (var i in this.paths) {
        //var path=this.paths[i];
        //var watcher=Fs.watch_directory(path);

        var watcher=Fs.watch_directory('./');
        
        watcher.on('all',function(event,path){
          if ((path.indexOf('app/')===0)||(path.indexOf('packages/')===0)) {
            if (path.indexOf('/controller/')>=0)
              need_rewrites=true;
            if (update_timeout!==false)
              clearTimeout(update_timeout);
            update_timeout=setTimeout(updatefunc,100);
            var extpos=path.lastIndexOf('.');
            if (extpos>=0) {
              var extension=path.substring(extpos);
              var basename=path.substring(0,extpos);
              if ((event==='add')||(event==='change')||(event==='unlink')) {
                var compiler=get_compiler(extension);
                if (compiler!==null) {
                  var finalpath='./compiled/'+basename+compiler.dest;
                  if (event==='unlink') {
                    Fs.remove_file(finalpath);
                    var spos=finalpath.lastIndexOf('/');
                    if (spos>=0) {
                      var fdir=finalpath.substring(0,spos);
                      var files=Fs.list_directory(fdir);
                      if (!files.length)
                        Fs.remove_directory(fdir);
                    }
                  }
                  else {
                    Sorcery.require([
                      'service/compiler/'+compiler.name
                    ],function(Compiler){
                      var src=Fs.read_file('./'+path);
                      Compiler.compile(src,function(dst){
                        Fs.write_file(finalpath,dst);
                        Cli.print('compiled '+path+'\n');
                      });
                    });
                  }
                }
              }
            }
          }
        });
        
      //}
      
    },
    
  });

});
