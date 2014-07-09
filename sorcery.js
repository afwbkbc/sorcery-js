var Sorcery;

if (typeof(GLOBAL)==='undefined')
  GLOBAL={};

if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {
    
    ENVIRONMENT_CLI : 'cli',
    ENVIRONMENT_WEB : 'web',
      
    packages : [ 'sorcery/core' ],
    
    path_cache : {},
    resource_cache : {},

    required : [],
  
    intervals : [],
  
    async_queue : [],
  
    template_engines : {
      'twig':'.html.twig',
      'static':'.html',
    },
    
    get_require_paths : function() {
      var look_in=['./','./app/','./packages/'];
      for (var i in this.packages)
        look_in.push('./packages/'+this.packages[i]+'/');
      return look_in;
    },
    
    set_path_cache : function(path_cache) {
      this.path_cache=path_cache;
    },
    
    set_resource_cache : function(resource_cache) {
      this.resource_cache=resource_cache;
    },
    
    resolve_path : function(path,type) {
      var pc=Sorcery.path_cache[type];
      if (typeof(pc)!=='undefined') {
        var p=pc[path];
        if (typeof(p)!=='undefined') {
          var ret=p+path;
          if (Sorcery.environment===Sorcery.ENVIRONMENT_WEB)
            ret='/'+ret;
          return ret;
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
    
    require_preparse : function(modulenames) {
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
          cb.apply(obj,na);
          finished.push(cb);
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
      return function() {
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

    call : function(func) {
      console.log('CALL',func);
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
    
    exit : function() {
      for (var i in this.intervals) {
        var interval=this.intervals[i];
        if (interval!==false)
          clearInterval(interval);
      }
    }
    
  };
  
  Sorcery=GLOBAL.Sorcery;
  
  Sorcery.interval(function(){
    var q=Sorcery.async_queue[0];
    if (typeof(q)!=='undefined') {
      Sorcery.async_queue=Sorcery.async_queue.splice(1);
      q.func.apply(this,q.args);
      //console.log('CALL',q);
    }
  },1);
  
  if (typeof module !== 'undefined' && module.exports) {
    
    Sorcery.environment = Sorcery.ENVIRONMENT_CLI;
    
    try {
      require('./cache.js');
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND')
        throw e;
    }
    
    Sorcery.require = function(modulenames,callback) {
      modulenames=Sorcery.require_preparse(modulenames);
      var look_in=this.get_require_paths();
      var collectedmodules=[];
      var self=this;
      var innerloop=function() {
        while (modulenames.length) {
          var modulename=modulenames[0];
          modulenames=modulenames.splice(1);
          if (typeof(self.required[modulename])==='undefined') {
            var module=null;
            for (var ii in look_in) {
              try {
                var modulepath=require.resolve(look_in[ii]+modulename);
              } catch (e) {
                if (e.code!=='MODULE_NOT_FOUND')
                  throw e;
                else
                  continue;
              }
              self.requiring[modulepath]=modulename;
              module=require(modulepath);
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
        Sorcery.require(modulenames,function(){
          var ret=callback.apply(null,arguments);
          Sorcery.required[modulename]=ret;
        });
        delete this.requiring[modulepath];
      }
    };
    
    exports={
        Sorcery:GLOBAL.Sorcery,
    };

    Sorcery.require([
      'service/aux',
      'service/fs',
      'service/cli',
    ],function(Aux,Fs,Cli){

      if (module.parent===null) {

        if (!Fs.file_exists('./cache.js')) {
          Cli.print('initializing cache...');
          Cli.mute();
          Aux.update_cache();
          Aux.reload_cache();
          Cli.unmute();
          Cli.print('done\n');
        }

        var files=Fs.list_directory('./app');
        if (!files.length) {
          Aux.init_app();
          
          Cli.mute();
          Aux.update_cache();
          Cli.unmute();
          
          Aux.reload_cache();
          
        }
    
        Cli.print('\nsorcery backend started\n\n');
    
        require('./app/backend.js');
      }
    
    });

  }
  else {
    Sorcery.environment = Sorcery.ENVIRONMENT_WEB;

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
              
              modulenames=Sorcery.require_preparse(modulenames);
              
              var tofetch=modulenames.length;
              var isready=true;
              var modules=[];
              var success=function(module) {
                if (module!==null)
                  modules.push(module);
                tofetch--;
                if (tofetch<1) {
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
                else path='./';
                if (typeof(Sorcery.requiring[modulename])==='undefined') {
                  Sorcery.requiring[modulename]=true;
                  Fetcher.get_js('/'+path+modulename+'.js',function(content){
                    return success(null);
                  },function(){
                    throw new Error('Unable to load module "'+modulename+'"!');
                  }).setAttribute('data-module',modulename);
                }
                else
                  return success(null);
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
