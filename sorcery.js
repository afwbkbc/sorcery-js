var Sorcery;

if (typeof(GLOBAL)==='undefined')
  GLOBAL={};

if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {

    ENVIRONMENT_CLI : 'cli',
    ENVIRONMENT_WEB : 'web',

    origin_url : 'http://sorceryjs.org',
    
    packages : [ 'sorcery/core' ],
    
    node_dependencies : [
      'chokidar',
      'nodegit',
      'node-sass'
    ],
    
    path_cache : {},
    resource_cache : {},

    required : [],
    requiring : [],
    defining : [],
  
    intervals : [],
  
    async_queue : [],
  
    engines : {
      template : {
        twig:'.html.twig',
        static:'.html',
      },
      style : {
        static:'.css',
      },
    },
    
    compilers : {
      sass:{
        type:'style',
        engine:'static',
        source:'.scss',
        dest:'.css',
      }
    },
    
    unrequire : function(modulenames) {
      if (typeof(modulenames)==='string')
        modulenames=[modulenames];
      modulenames=Sorcery.path_preparse(modulenames);
      for (var i in modulenames) {
        var modulename=modulenames[i];
        if (typeof(Sorcery.required[modulename])!=='undefined') {
          delete Sorcery.required[modulename];
        }
      }
    },
    
    get_require_paths : function() {
      var look_in=['./','./app/','./packages/'];
      for (var i in this.packages)
        look_in.push('./packages/'+this.packages[i]+'/');
      return look_in;
    },
    
    set_packages : function(packages) {
      this.packages=packages;
    },
    
    set_path_cache : function(path_cache) {
      this.path_cache=path_cache;
    },
    
    set_resource_cache : function(resource_cache) {
      this.resource_cache=resource_cache;
    },
    
    resolve_path : function(path,type,preferredpackage) {
      
      if (path.substring(0,2)==='./')
        return path;
      
      var types=[];
      if (type.indexOf('*')===type.length-1) {
        for (var i in Sorcery.path_cache)
          if ((type==='*')||(i.indexOf(type.substring(0,type.length-1))>=0))
            types.push(i);
      }
      else
        types.push(type);
      for (var i in types) {
        var type=types[i];
        var pc=Sorcery.path_cache[type];
        if (typeof(pc)!=='undefined') {
          var p=pc[path];
          if (typeof(p)!=='undefined') {
            var bestp=null;
            for (var ii in p) {
              var pp=p[ii];
              if (preferredpackage===null) {
                if (pp.indexOf('./app/')===0) {
                  bestp=pp;
                  break;
                }
              }
              else if (typeof(preferredpackage)==='string') {
                if (pp.indexOf('./packages/'+preferredpackage+'/')===0) {
                  bestp=pp;
                  break;
                }
              }
              if (pp.indexOf('./app/')===0)
                bestp=pp;
              else if (bestp===null)
                bestp=pp;
            }
            var ret=bestp+path;
            if (Sorcery.environment===Sorcery.ENVIRONMENT_WEB)
              ret='/'+ret;
            return ret;
          }
        }
      }
      return null;
    },
    
    resolve_file : function(path,preferredpackage) {
      
      var epos=path.lastIndexOf('.');
      if (epos>=0) {
        var extension=path.substring(epos);
        var key;
        if (extension==='.js')
          key='js';
        else {
          for (var i in Sorcery.engines) {
            var engines=Sorcery.engines[i];
            for (var ii in engines) {
              var ext=engines[ii];
              if (ext===extension) {
                var basename=path.substring(0,epos);
                var ret=Sorcery.resolve_path(basename,i+'/'+ii,preferredpackage);
                if (ret!==null)
                  ret+=extension;
                return ret;
              }
            }
          }
        }
      }
      return null;
    },
    
    resolve_resource : function(path) {
      var rc=Sorcery.resource_cache[path];
      if (typeof(rc)!=='undefined') {
        var ret=rc+path;
        if (Sorcery.environment===Sorcery.ENVIRONMENT_WEB)
          ret='/'+ret;
        return ret;
      }
      return null;
    },
    
    path_preparse : function(modulenames) {
      if (typeof(modulenames)==='string')
        modulenames=[modulenames];
      var newmodulenames=[];
      for (var i in modulenames) {
        var modulename=modulenames[i];
        // TODO: full regexp support?
        var pos=modulename.indexOf('*');
        if (pos>=0) {
          var m1=modulename.substring(0,pos);
          var m2=modulename.substring(pos+1);
          for (var ii in Sorcery.path_cache.js) {
            var path=ii;
            if ((!m1.length)||(path.indexOf(m1)===0)) {
              var p=path.substring(m1.length);
              if ((!m2.length)||(p.indexOf(m2)===p.length-m2.length)) {
                p=p.substring(0,p.length-m2.length);
                if (p.indexOf('/')<0)
                  newmodulenames.push(path);
              }
            }
          }
        }
        else
          newmodulenames.push(modulename);
      };
      return newmodulenames;
    },
    
    get_class_chain : function(obj) {
      obj=obj.this_class;
      var chain=[];
      do {
        chain.push(obj);
        obj=obj.parent_class;
      } while (obj);
      return chain;
    },
    
    apply_chain : function(obj,method,chain,callback,args) {
      var finished=[];
      var next_func=function() {
        chain=chain.splice(1);
        if (chain.length)
          return apply_func();
        else {
          if (typeof(callback)==='function')
            return callback(obj);
        }
      };
      var apply_func=function() {
        var c=chain[0];
        var cb=c[method];
        if (typeof(cb)==='undefined') {
          return next_func();
        }
        else {
          for (var i in finished) {
            if (finished[i]===cb)
              return next_func();
          }
          var na=args.slice();
          na.push(next_func);
          finished.push(cb);
          cb.apply(obj,na);
        }
      };
      apply_func();
    },
    
    apply : function(obj,method,callback,args) {
      var chain=this.get_class_chain(obj);
      this.apply_chain(obj,method,chain,callback,args);
    },
    
    apply_reverse : function(obj,method,callback,args) {
      var chain=this.get_class_chain(obj).reverse();
      this.apply_chain(obj,method,chain,callback,args);
    },
    
    construct : function(classobj) {
      var newobj={};
      for (var i in classobj) {
        newobj[i]=classobj[i];
      }
      
      if (typeof(newobj.construct)==='function') {
        var args=[];
        for (var i=1;i<arguments.length;i++)
          args.push(arguments[i]);
        var callback;
        if (typeof(args[args.length-1])==='function')
          callback=args.pop();
        else callback=null;
        Sorcery.apply_reverse(newobj,'construct',callback,args);
      }
      
      return newobj;
    },
    
    destroy : function(obj) {
      if (typeof(obj.destroy)==='function') {
        var args=[];
        for (var i=1;i<arguments.length;i++)
          args.push(arguments[i]);
        var callback;
        if (typeof(args[args.length-1])==='function')
          callback=args.pop();
        else callback=null;
        Sorcery.apply(obj,'destroy',function(){
          for (var i in obj) {
            delete obj[i];
          };
          obj._destroyed=true;
          if (typeof(callback)==='function')
            return callback();
        },args);
      }
    },
    
    call_stack : [],
    call_stack_last_id : null,
    
    method : function(func) {
      return function(__SORCERY_METHOD__) {
        var args=[];
        for (var i=0;i<arguments.length;i++)
          args.push(arguments[i]);
        var callback;
        if (typeof(args[args.length-1])==='function')
          callback=args.pop();
        else callback=null;
        var i=0;
        while (Sorcery.call_stack[i]) i++;
        Sorcery.call_stack[i]={
          func:func,
          arguments:args,
          callback:callback,
        };
        Sorcery.call_stack_last_id=i;
        
        return func.apply(this,args);
      };
    },

    call : function() {
      var func=arguments[0];
      if (typeof(func)!=='function')
        throw new Error('first argument of Sorcery.call must be function, '+func+' given');
      var parameters=[];
      var callback=null;
      for (var i in arguments) {
        if (+i===0)
          continue;
        var a=arguments[i];
        if (+i===arguments.length-1) {
          if (typeof(a)!=='function')
            throw new Error('last argument of Sorcery.call must be function, '+a+' given');
          callback=a;
        }
        else
          parameters.push(a);
      }
      var str=func.toString();
      
      var search='function (__SORCERY_METHOD__)';
      if (str.substring(0,search.length)===search) { // its Sorcery method
        parameters.push(function(){
          if (typeof(callback)==='function') {
            var callbackowner=callback.owner;
            if (!callbackowner)
              callbackowner=null;
            return callback.apply(callbackowner,arguments);
          }
        });
        func.apply(func.owner,parameters);
      }
      else { // regular method
        var ret=func.apply(func.owner,parameters);
        if (typeof(callback)==='function')
          return callback(ret);
      }
    },
    
    begin : function() {
      var sid=Sorcery.call_stack_last_id;
      if (sid===null)
        throw new Error('failed to get sid, Sorcery.begin() called in wrong place or multiple times?');
      Sorcery.call_stack_last_id=null;
      return sid;
    },
    
    end : function(sid) {
      var s=Sorcery.call_stack[sid];
      if (!s)
        throw new Error('invalid sid, duplicate Sorcery.end() ?');
      Sorcery.call_stack[sid]=null;
      if (typeof(s.callback)==='function') {
        var args=[];
        for (var i=1;i<arguments.length;i++)
          args.push(arguments[i]);
        return s.callback.apply(this,args);
      }
    },
    
    loop : {
      
      for : function(init,condition,iterator,body,callback) {
        var breakfunc=function(){
          if (typeof(callback)==='function')
            return callback();
        };
        var continuefunc=function(){
          if ((typeof(condition)!=='function')||condition()) {
            return body(function(){
              if (typeof(iterator)==='function')
                iterator();
              return Sorcery.async(continuefunc);
            },breakfunc);
          }
          else
            return breakfunc();
        };
        if (typeof(init)==='function')
          init();
        continuefunc();
      }
      
    },
    
    async : function(func) {
      var args=[];
      for (var i=1;i<arguments.length;i++)
        args.push(arguments[i]);
      this.async_queue.push({
        func:func,
        args:args
      });
    },
    
    interval : function(callback,ms) {
      
      var index=this.intervals.length;
      this.intervals.push(setInterval(function(){
        var ret=callback();
        if (ret===false) {
          clearInterval(Sorcery.intervals[index]);
          Sorcery.intervals[index]=false;
        }
      },ms));
    },
    
    stop_intervals : function() {
      for (var i in this.intervals) {
        var interval=this.intervals[i];
        if (interval!==false) {
          clearInterval(interval);
        }
      }
    },
    
    exit : function() {
      this.stop_intervals();
      process.exit();
    },
    
    exec : function(cmd,callback) {
      if (typeof(this.cp)==='undefined')
        this.cp=require('child_process');
      var c='';
      var args=[];
      var p=cmd.indexOf(' ');
      if (p>=0) {
        c=cmd.substring(0,p);
        do {
          cmd=cmd.substring(p+1);
          p=cmd.indexOf(' ');
          if (p>=0) {
            var a=cmd.substring(0,p);
            if (a.length>0)
              args.push(a);
          }
        } while (p>=0);
        if (cmd.length>0)
          args.push(cmd);
      }
      else
        c=cmd;
      var p=this.cp.spawn(c,args);
      p.stdout.on('data',function(data){
        process.stdout.write(data);
      });
      p.stderr.on('data',function(data){
        process.stderr.write(data);
      });
      p.on('exit',function(code){
        if (typeof(callback)==='function')
          callback(code);
      });
    },
    
    restart : function() {
      Sorcery.stop_intervals();
      var cmd='';
      for (var i in process.argv)
        cmd+=' '+process.argv[i];
      if (process.argv.length<2)
        cmd+=' ./sorcery.js';
      this.exec(cmd.substring(1),function(code){
        Sorcery.exit();
      });
    }
    
  };
  
  Sorcery=GLOBAL.Sorcery;
  
  Sorcery.interval(function(){
    var q=Sorcery.async_queue[0];
    if (typeof(q)!=='undefined') {
      Sorcery.async_queue=Sorcery.async_queue.splice(1);
      q.func.apply(this,q.args);
    }
  },1);

  if (typeof module !== 'undefined' && module.exports) {
    
    Sorcery.environment = Sorcery.ENVIRONMENT_CLI;

    var fname=module.filename;

    var stdinstring='[stdin]';
    if (fname.lastIndexOf(stdinstring)===fname.length-stdinstring.length) {
      var code=process._eval;
      if (!code)
        throw new Error('internal error: process._eval failed');
      require("fs").writeFileSync('./sorcery.js',code,'utf8');
      Sorcery.restart();
    }
    else {
      
      var fnamepos=fname.lastIndexOf('/sorcery.js');
      if (fnamepos<0)
        throw new Error('internal error: module.filename does not contain "/sorcery.js"');

      Sorcery.root_path=fname.substring(0,fnamepos);

      process.chdir(Sorcery.root_path);

      var coredir='./packages/sorcery/core';
      var fs=require("fs");
      if (!fs.existsSync(coredir)) {
        var giturl='/home/nj/work/sorceryjs.lh/packages/sorcery/core';
        process.stdout.write('downloading sorcery/core...');
        Sorcery.exec('git clone '+giturl+' '+coredir,function(result,err){
          if (!fs.existsSync(coredir+'/.git'))
            throw new Error('cloning core failed (source: '+giturl+', dest: '+coredir+')');
          process.stdout.write('done\n');
          Sorcery.restart();
        });
      }

      else {
        
        Sorcery.require_towrap={};

        Sorcery.require = function(modulenames,callback,preferredpackage) {
          modulenames=Sorcery.path_preparse(modulenames);
          var look_in=this.get_require_paths();
          var collectedmodules=[];
          var self=this;
          var innerloop=function() {
            while (modulenames.length) {
              var modulename=Sorcery.resolve_path(modulenames[0],'js',preferredpackage);
              modulenames=modulenames.splice(1);
              if (modulename===null) {
                collectedmodules.push(null);
                continue;
              }
              
              if (typeof(self.required[modulename])==='undefined') {
                var module=null;
                for (var ii in look_in) {
                  try {
                    var modulepath=require.resolve(look_in[ii]+modulename);
                  } catch (e) {
                    if (e.code!=='MODULE_NOT_FOUND')
                      throw e;
                    else {
                      collectedmodules.push(null);
                      continue;
                    }
                  }
                  self.requiring[modulepath]=modulename;
                  if (typeof(Sorcery.require_towrap[modulepath])==='undefined') {
                    Sorcery.require_towrap[modulepath]=true;
                    module=require(modulepath);
                  }
                  else {
                    Sorcery.require([
                      'service/fs',
                    ],function(Fs){
                      var code=Fs.read_file(modulepath);
                      var wrapargs=function(first,second,third) {
                        eval(code);
                        module={};
                      };
                      return wrapargs(null,null,{
                        id:modulepath
                      });
                    });
                  }
                  break;
                }
                if (module===null) {
                  // maybe cache is outdated, no reason to emit error?
                  //throw new Error('Module "'+modulename+'" could not be found in any paths ('+JSON.stringify(look_in)+')!');
                  collectedmodules.push(null);
                }
              }
              collectedmodules.push(self.required[modulename]);
            }
            callback.apply(null,collectedmodules);
          };
          innerloop();
        };

        Sorcery.requiring = [];

        Sorcery.define = function(modulenames,callback) {
          var modulepath=arguments.callee.caller.arguments[2].id;
          var modulename=this.requiring[modulepath];
          if (modulename) {
            var packagesstr='./packages/';
            var preferredpackage;
            if (modulename.indexOf(packagesstr)<0)
              preferredpackage=null;
            else {
              var f=modulename.substring(packagesstr.length);
              var p;
              if ((p=f.indexOf('/'))>=0) {
                preferredpackage=f.substring(0,p);
                f=f.substring(p+1);
                if ((p=f.indexOf('/'))>=0)
                  preferredpackage+='/'+f.substring(0,p);
                else
                  preferredpackage=null;
              }
              else
                preferredpackage=null;
            }
            Sorcery.require(modulenames,function(){
              var ret=callback.apply(null,arguments);
              Sorcery.required[modulename]=ret;
            },preferredpackage);
            delete this.requiring[modulepath];
          }
        };

        exports={
            Sorcery:GLOBAL.Sorcery
        };
        
        try {
          require('./cache.js');
        } catch (e) {
          if (e.code !== 'MODULE_NOT_FOUND')
            throw e;
          else {
            var corepkg=['./packages/sorcery/core/'];
            Sorcery.set_path_cache({
              js:{
                'class/class':corepkg,
                'class/service':corepkg,
                'service/cli':corepkg,
                'service/aux':corepkg,
                'service/fs':corepkg
              }
            });
            Sorcery.require([
              'service/cli',
              'service/aux'
            ],function(Cli,Aux){

              Cli.print('initializing cache...');
              Cli.mute();
              Aux.update_cache();
              Aux.reload_cache();
              Cli.unmute();
              Cli.print('done\n');
              
            });
          }
        }

        Sorcery.require([
          'service/aux',
          'service/fs',
          'service/cli'
        ],function(Aux,Fs,Cli){
          
          if (!Fs.file_exists('./sorcery.html')) {
            var resolved=Sorcery.resolve_resource('base_html');
            if (resolved===null)
              throw new Error('internal error: base html resource not found');
            Cli.print('initializing sorcery.html...');
            Fs.copy_file(resolved,'./sorcery.html');
            Cli.print('done\n');
          }
          
          var deps=[];
          for (var i in Sorcery.node_dependencies) {
            var dep=Sorcery.node_dependencies[i];
            if (!Fs.file_exists('./node_modules/'+dep))
              deps.push(dep);
          }
          
          var idep;
          
          if (deps.length>0) {
            Cli.print('\ninstalling required nodejs modules:');
            for (var i in deps)
              Cli.print(' '+deps[i]);
            Cli.print('\n\n');
          }
          
          Sorcery.loop.for(
            function() { idep=0; },
            function() { return idep<deps.length; },
            function() { idep++; },
            function(cont) {
              var dep=deps[idep];
              
              Sorcery.exec('npm install '+dep,function(code){
                return cont();
              });
              
            },
            function() {
              
              var command=Cli.get_parameter(0);

              if (command) {
                var loaded=false;
                try {
                  Sorcery.require('command/'+command,function(Command){
                    if (Command===null)
                      throw new Error;
                    loaded=true;
                    Cli.print('\n');
                    Sorcery.call(Command.run,Cli.get_parameters(),function(){
                      Cli.print('\n');
                      return Sorcery.exit();
                    });
                  });
                } catch (e) {
                  if (!loaded) {
                    Cli.print('Command "'+command+'" does not exist! Run "'+process.argv[0]+' sorcery.js help" to see available commands.\n');
                    return Sorcery.exit();
                  }
                  else throw e;
                }
              }
              else {

                if (!Fs.file_exists('./app'))
                  Fs.mkdir('./app');

                var files=Fs.list_directory('./app');
                if (!files.length) {
                  Aux.init_app();

                  Cli.mute();
                  Aux.update_cache();
                  Cli.unmute();

                  Aux.reload_cache();

                }

                Cli.print('\n[!] sorcery backend started\n\n');

                require('./app/backend.js');
              }
            }
          );
        });
      }
    }
  }
  else {
    Sorcery.environment = Sorcery.ENVIRONMENT_WEB;

    var l=window.location;

    Sorcery.request={
      host:l.host,
      port:l.port,
      origin:l.origin,
      protocol:l.protocol,
    };

    Sorcery.root_path=Sorcery.request.protocol+'//'+Sorcery.request.host;
    if (Sorcery.request.port!=='')
      Sorcery.root_path+=':'+Sorcery.request.port;

    // need to fetch fetcher first, have to use some hacks
    Sorcery.define = function(modulenames,callback) {
      var modules=[];
      for (var i in modulenames)
        modules.push(Sorcery.required[modulenames[i]]);
      return callback.apply(null,modules);
    };
    
    var dirtyjs = function(jscode) {
      var script = document.createElement('script');
      script.innerHTML=jscode;
      document.head.appendChild(script);
    };
    
    var dirtyfetch = function(path,callback) {
      var xmlhttp=new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if (xmlhttp.status == 200) {
             dirtyjs('Sorcery.required[\''+path+'\']='+xmlhttp.responseText+';');
             return callback();
           }
           else 
             throw new Error('Unable to load fetcher, terminating application.');
        }
      };
      xmlhttp.open('GET', '/packages/sorcery/core/'+path+'.js', true);
      xmlhttp.send();
    };
    dirtyfetch('class/class',function(){
      dirtyfetch('class/service',function(){
        dirtyfetch('service/fetcher',function(){
          var Fetcher=Sorcery.required['service/fetcher'];

          Fetcher.js_loaded['class/class']=true;
          Fetcher.js_loaded['class/service']=true;
          Fetcher.js_loaded['class/fetcher']=true;
          
          Fetcher.get_js('/cache.js',function(content){
            
            dirtyjs(content);
            
            Sorcery.require_stack=[];
            
            Sorcery.requiring=[];
            
            Sorcery.require = function(modulenames,callback) {
              
              // TODO: check where modules reside
              
              if (!modulenames.length)
                return callback.apply(null);
              
              modulenames=Sorcery.path_preparse(modulenames);
              
              //console.log('MODULENAMES',modulenames);
              var tofetch=modulenames.length;
              var isready=true;
              var modules=[];
              var success=function(module) {
                if (module!==false)
                  modules.push(module);
                tofetch--;
                if (tofetch<1) {
                  //console.log('SUCCESS',isready,module);
                  if (isready)
                    return callback.apply(null,modules);
                  else {
                    setTimeout(function(){
                      Sorcery.require(modulenames,callback);
                    },10);
                  }
                }
              };
              var fetchfunc=function(modulename) {
                isready=false;
                var path=null;
                if (typeof(Sorcery.path_cache.js[modulename])!=='undefined')
                  path=Sorcery.path_cache.js[modulename];
                else
                  return success(Sorcery.required[modulename]=null);
                if (typeof(Sorcery.requiring[modulename])==='undefined') {
                  Sorcery.requiring[modulename]=true;
                  Sorcery.defining[modulename]=true;
                  Fetcher.get_js('/'+path+modulename+'.js',function(){
                    if (typeof(Sorcery.defining[modulename])!=='undefined') {
                      return Sorcery.require([],function(){
                        delete Sorcery.requiring[modulename];
                        return success(Sorcery.required[modulename]=null);
                      });
                    }
                    else
                      return success(false);
                  },function(){
                    throw new Error('Unable to load module "'+modulename+'"!');
                  }).setAttribute('data-module',modulename);
                }
                else {
                  return success(false);
                }
              };
              for (var i in modulenames) {
                var modulename=modulenames[i];
                if (typeof(Sorcery.required[modulename])!=='undefined')
                  success(Sorcery.required[modulename]);
                else
                  fetchfunc(modulename);
              }
            };

            Sorcery.last_required=null;
            
            Sorcery.define = function(modulenames,callback) {
              
              if (typeof(modulenames)==='function') {
                callback=modulenames;
                modulenames=[];
              }
              
              var scriptel=null;
              
              if (typeof(document.currentScript)!=='undefined')
                scriptel=document.currentScript;
              else { // ugly workaround for ie and older versions of browsers
                
                var e=new Error;
                var s=e.stack;
                
                if (typeof(s)==='undefined') { // IE
                  try {
                    throw e;
                  } catch(e) {
                    s=e.stack;
                  }
                }
                
                if (typeof(s)==='undefined') { // old safari
                  // TODO: implement somehow
                  throw new Error('this version of safari is not supported yet');
                }
                
                var lp=s.lastIndexOf('@'); // firefox
                if (lp<0) {
                  lp=s.lastIndexOf(' at '); // chrome or IE
                  if (lp<0)
                    throw new Error('internal error: neither @ nor "at " found in .stack!');
                  s=s.substring(lp+4);
                  lp=s.indexOf('(');
                  if (lp>=0) { // IE
                    s=s.substring(lp+1);
                  }
                }
                else
                  s=s.substring(lp+1);
                lp=s.lastIndexOf(':');
                if (lp>=0) {
                  s=s.substring(0,lp);
                  lp=s.lastIndexOf(':');
                  if (lp>s.length-7)
                    s=s.substring(0,lp);
                }
                
                var scripts=document.getElementsByTagName('SCRIPT');
                for (var i in scripts) {
                  var si=scripts[i];
                  if (si.src==s) {
                    scriptel=si;
                    break;
                  };
                }
              }
              
              if (scriptel===null)
                throw new Error('internal error: script element not found');
              
              var modulename=scriptel.getAttribute('data-module');
              if (!modulename)
                throw new Error('internal error: module name not defined in script tag');
              
              delete Sorcery.defining[modulename];
              
              return Sorcery.require(modulenames,function(){
                Sorcery.required[modulename]=callback.apply(null,arguments);
                Sorcery.required[modulename].module_name=modulename;
                delete Sorcery.requiring[modulename];
              });
            };

            Fetcher.get_js('/app/frontend.js');
            
          },function(){
            throw new Error('Unable to load Sorcery cache!');
          });
          
        });
      });
    });
    
    delete GLOBAL;
  }
  
    
};
