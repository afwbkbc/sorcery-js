var Sorcery;

if (typeof(GLOBAL)==='undefined')
  GLOBAL={};

if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {
    
    ENVIRONMENT_CLI : 'cli',
    ENVIRONMENT_WEB : 'web',
      
    packages : [ 'sorcery/core' ],
    
    path_cache : {},

    required : [],
  
    get_require_paths : function() {
      var look_in=['./','./app/','./packages/'];
      for (var i in this.packages)
        look_in.push('./packages/'+this.packages[i]+'/');
      return look_in;
    },
    
    require_environment : function(desired_environment) {
      if (this.environment!=desired_environment)
        throw new Error('This routine requires "'+desired_environment+'" environment, but "'+this.environment+'" is active!');
    },
    
    set_path_cache : function(path_cache) {
      this.path_cache=path_cache;
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
          for (var ii in Sorcery.path_cache) {
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
        if (typeof(cb)==='undefined')
          return next_func();
        else {
          var na=args.slice();
          na.unshift(next_func);
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
    
    construct : function(classobj,callback) {
      var newobj={};
      for (var i in classobj) {
        newobj[i]=classobj[i];
      }
      
      if (typeof(newobj.construct)==='function') {
        var args=[];
        for (var i=2;i<arguments.length;i++)
          args.push(arguments[i]);
        Sorcery.apply_reverse(newobj,'construct',callback,args);
      }
      
      return newobj;
    },
    
    destroy : function(obj,callback) {
      if (typeof(obj.destroy)==='function') {
        var args=[];
        for (var i=2;i<arguments.length;i++)
          args.push(arguments[i]);
        Sorcery.apply(obj,'destroy',function(){
          for (var i in obj) {
            delete obj[i];
          };
          if (typeof(callback)==='function')
            return callback();
        },args);
      }
    }
    
  };
  
  Sorcery=GLOBAL.Sorcery;
  
  if (typeof module !== 'undefined' && module.exports) {
    
    Sorcery.environment = Sorcery.ENVIRONMENT_CLI;
    
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
              throw new Error('Module "'+modulename+'" could not be found in any paths ('+JSON.stringify(look_in)+')!');
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
      document.body.appendChild(script);
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
          
          Fetcher.get_js('/cache.js',function(content){
            
            dirtyjs(content);
            
            Sorcery.require_stack=[];
            
            Sorcery.requiring=[];
            
            Sorcery.require = function(modulenames,callback) {
              
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
                if (typeof(Sorcery.path_cache[modulename])!=='undefined')
                  path=Sorcery.path_cache[modulename];
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
