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
  
    uniqs : {},
  
    async_queue : [],

    engines : {
      template : {
        twig:'.html.twig',
        static:'.html'
      },
      style : {
        static:'.css'
      }
    },
    
    compilers : {
      sjs:{
        type:'js',
        source:'.sjs',
        dest:'.js'
      },
      sass:{
        type:'style',
        engine:'static',
        source:'.scss',
        dest:'.css'
      }
    },
    
    unique_id : function(key) {
      if (typeof(this.uniqs[key])==='undefined')
        this.uniqs[key]=0;
      var ret=this.uniqs[key];
      this.uniqs[key]++;
      return ret;
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
    
    call_stack : [],
    call_stack_last_id : null,
    
    method : function(func) {
      var ret=function() {
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
      ret._s_sorcery_method=true;
      return ret;
    },

    apply : function(func,args,callback) {
      if (typeof(func)!=='function')
        throw new Error('First argument of Sorcery.apply must be function, '+typeof(func)+' given!');
      if ((typeof(args)!=='object')||(args.constructor !== Array))
        throw new Error('Second argument of Sorcery.apply must be array, '+typeof(args)+' given!');
      if (typeof(callback)==='function')
        args.push(callback);
      return Sorcery.call.apply(this,args);
    },

    call : function() {
      var func=arguments[0];
      if (typeof(func)!=='function')
        throw new Error('First argument of Sorcery.call must be function, '+typeof(func)+' given!');
      var parameters=[];
      var callback=null;
      for (var i in arguments) {
        if (+i===0)
          continue;
        var a=arguments[i];
        if (+i===arguments.length-1) {
          if (typeof(a)!=='function') {
            callback=null;
            parameters.push(a);
          }
          else
            callback=a;
        }
        else
          parameters.push(a);
      }
      
      var funcname=func._s_method_name;
      var funcowner=func._s_owner;
      
      //if (funcname==='trigger')
        //console.log('CALL',func,funcname,funcowner,parameters);

      var recurseback=['construct'];
      var recurseforw=['destroy'];

      var funcchain=[];
      var funcids=[];
      if (recurseback.indexOf(funcname)>=0) {
        var o=funcowner;
        while (o=o.parent_class)
          if (typeof(o[funcname])==='function') {
            if (funcchain.indexOf(o[funcname])<0) {
              var id=o[funcname]._s_id;
              //console.log('ID',id,o[funcname],o,funcname);
              if (typeof(id)!=='undefined') {
                if (funcids.indexOf(id)<0) {
                  //console.log('ADD',o[funcname],funcname,id,o);
                  funcids.unshift(id);
                  funcchain.unshift(o[funcname]);
                }
              }
            }
          }
      }
      var id=func._s_id;
      //console.log('ID',id,typeof(id));
      //console.log('INDEXOF',funcowners,owner,funcowners.indexOf(owner));
      if ((typeof(id)==='undefined')||(funcids.indexOf(id)<0)) {
        //console.log('ADD',func,func._s_name,func._s_owner,funcowner);
        funcids.push(id);
        funcchain.push(func);
      }
      if (recurseforw.indexOf(funcname)>=0) {
        var o=funcowner;
        while (o=o.parent_class)
          if (typeof(o[funcname])==='function') {
            if (funcchain.indexOf(o[funcname])<0) {
              var id=o[funcname]._s_id;
              //console.log('ID',id);
              if (typeof(id)!=='undefined') {
                if (funcids.indexOf(id)<0) {
                  //console.log('ADD',o[funcname],funcname,id);
                  funcids.push(id);
                  funcchain.push(o[funcname]);
                }
              }
            }
          }
      }
      
      //console.log('CHAIN',funcname,funcowner,funcchain,funcids);
      
      var retargs;
      
      var i;
      Sorcery.loop.for(
        function(){ i=0; },
        function(){ return i<funcchain.length; },
        function(){ i++; },
        function(cont) {
          var f=funcchain[i];
          if (f._s_sorcery_method) {
            parameters.push(function(){
              retargs=arguments;
              return cont();
            });
            f.apply(funcowner,parameters);
            parameters.pop();
          }
          else {
            retargs=[f.apply(funcowner,parameters)];
            return cont();
          }
        },
        function() {
          if (typeof(callback)==='function') {
            var callbackowner=callback._s_owner;
            if (!callbackowner)
              callbackowner=null;
            return callback.apply(callbackowner,retargs);
          }
      
        }
      );
      
    },
    
    begin : function() {
      var sid=Sorcery.call_stack_last_id;
      if (sid===null) {
        console.log('x',(new Error).stack);
        throw new Error('failed to get sid, Sorcery.begin() called in wrong place or multiple times?');
      }
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
        return continuefunc();
      },
      
      while : function(condition,body,callback) {
        var breakfunc=function(){
          if (typeof(callback)==='function')
            return callback();
        };
        var continuefunc=function(){
          if ((typeof(condition)!=='function')||condition()) {
            return body(function(){
              return Sorcery.async(continuefunc);
            },breakfunc);
          }
          else
            return breakfunc();
        };
        return continuefunc();
      },
      
      in : function(object,body,callback) {
        var objdata=[];
        for (var i in object)
          objdata.push({
            key:i,
            value:object[i]
          });
        var i=0;
        return Sorcery.loop.while(
          function() { return i<objdata.length; },
          function(cont,brk) {
            var v=objdata[i];
            i++;
            if (typeof(body)==='function')
              return body(v.key,v.value,cont,brk);
            else
              return cont();
          },
          callback
        );
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
    
    exec : function(cmd,callback,options) {
      if (typeof(this.cp)==='undefined')
        this.cp=require('child_process');
      if (typeof(options)==='undefined')
        options={};
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
      if (!options.silent) {
        p.stdout.on('data',function(data){
          process.stdout.write(data);
        });
        p.stderr.on('data',function(data){
          process.stderr.write(data);
        });
      }
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
  
  Sorcery.clone = function(v,depth) {
    var ret;
    
    var type=typeof(v);
    
    if (!depth)
      depth=0;
    
    if (type==='function') {
      var origfunc=v;
      ret=function(){
        //console.log('CALL',origfunc,this,arguments);
        return origfunc.apply(this,arguments);
      };
      for (var ii in origfunc) {
        if (ii.substring(0,3)==='_s_')
          ret[ii]=origfunc[ii];
      }
    }
    else if (type==='object') {
      if (depth>0) {
        ret={};
        for (var i in v) {
          ret[i]=Sorcery.clone(v[i],depth-1);
        }
      }
      else
        ret=v;
    }
    else if (['boolean','string'].indexOf(type)>=0) {
      ret=v;
    }
    else {
      throw new Error('unknown type "'+type+'"');
    }
    
    //console.log('CLONE',v,ret);
    
    return ret;
  };
  
  Sorcery.get = Sorcery.method(function(obj,key){
    var sid=Sorcery.begin();
    
    if (typeof(obj)!=='object')
      throw new Error('Sorcery.get called on non-object!');
    
    if (typeof(obj.get)==='function')
      return Sorcery.call(obj.get,key,function(value){
        return Sorcery.end(sid,value);
      });
    else
      return Sorcery.end(sid,obj[key]);
  });
  
  Sorcery.set = Sorcery.method(function(obj,k,v){
    var sid=Sorcery.begin();
    
    if (typeof(obj)!=='object')
      throw new Error('Sorcery.set called on non-object!');
    
    if (typeof(obj.set)==='function')
      return Sorcery.call(obj.set,k,v,function(){
        return Sorcery.end(sid);
      });
    else {
      if (typeof(k)!=='object') {
        if (typeof(k)!=='string')
          throw new Error('second argument of Sorcery.set must be object or string, got "'+typeof(k)+'"!');
        if (typeof(v)==='undefined')
          throw new Error('Sorcery.set: missing value for "'+k+'"');
        var newk={};
        newk[k]=v;
        k=newk;
      }
      for (var i in k) {
        obj[i]=k[i];
      }
      return Sorcery.end(sid);
    }
  });
  
  Sorcery.construct = Sorcery.method(function(classobj){
    var sid=Sorcery.begin();

    //var newobj=classobj.extend();
    
    var newobj={};
    
    for (var i in classobj) {
      var v=classobj[i];
      var vv=Sorcery.clone(v);
      if (typeof(vv)==='function')
        vv._s_owner=newobj;
      newobj[i]=vv;
    }

    if (typeof(newobj.construct)==='function') {
      var args=[];
      for (var i=1;i<arguments.length;i++)
        args.push(arguments[i]);
      args.unshift(newobj.construct);
      args.push(function(){
        return Sorcery.end(sid,newobj);
      });
      Sorcery.call.apply(newobj,args);
      
    }
    else
      return Sorcery.end(sid,newobj);
    
  });
  
  Sorcery.destroy = Sorcery.method(function(obj){
    var sid=Sorcery.begin();

    if (typeof(obj.destroy)==='function') {
      var args=[];
      for (var i=1;i<arguments.length;i++)
        args.push(arguments[i]);
      args.unshift(obj.destroy);
      args.push(function(){
        for (var i in obj) {
          delete obj[i];
        };
        obj._destroyed=true;
        return Sorcery.end(sid);
      });
      Sorcery.call.apply(obj,args);
      
    }
    else
      return Sorcery.end(sid);
    
  });
  
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
        var giturl='https://github.com/afwbkbc/sorcery-js-core.git';
        process.stdout.write('downloading sorcery/core...');
        Sorcery.exec('git clone '+giturl+' '+coredir,function(result,err){
          if (!fs.existsSync(coredir+'/.git'))
            throw new Error('cloning core failed (source: '+giturl+', dest: '+coredir+')');
          process.stdout.write('done\n');
          Sorcery.restart();
        },{
          silent:true
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
