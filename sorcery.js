var Sorcery;

if (typeof(GLOBAL)==='undefined')
  GLOBAL={};

if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {
    
    ENVIRONMENT_CLI : 'cli',
    ENVIRONMENT_WEB : 'web',
      
    packages : [ 'sorcery' ],
    
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
    
  };
  
  Sorcery=GLOBAL.Sorcery;
  
  if (typeof module !== 'undefined' && module.exports) {
    
    Sorcery.environment = Sorcery.ENVIRONMENT_CLI;
    
    Sorcery.initialize = function(callback) {
      callback.apply(null);
    },
    
    Sorcery.require = function(modulenames,callback) {
      if (typeof(modulenames)==='string')
        modulenames=[modulenames];
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

    Sorcery.initialize = function(callback) {
      
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
        xmlhttp.open('GET', 'packages/sorcery/'+path+'.js', true);
        xmlhttp.send();
      };
      dirtyfetch('class/class',function(){
        dirtyfetch('class/library',function(){
          dirtyfetch('library/fetcher',function(){
            var Fetcher=Sorcery.required['library/fetcher'];
            
            Fetcher.get_file('cache.js',function(content){
              
              dirtyjs(content);
              
              Sorcery.require = function(modulenames,callback) {
                if (typeof(modulenames)==='string')
                  modulenames=[modulenames];
                var tofetch=modulenames.length;
                var modules=[];
                var success=function(index,module) {
                  modules[index]=module;
                  tofetch--;
                  if (tofetch<1) {
                    return callback.apply(null,modules);
                  }
                };
                var fetchfunc=function(index,modulename) {
                  var path=null;
                  if (typeof(Sorcery.path_cache[modulename])!=='undefined')
                    path=Sorcery.path_cache[modulename];
                  else path='./';
                  Fetcher.get_file(path+modulename+'.js',function(content){
                    dirtyjs('var _sorcery_require_module_name=\''+modulename+'\'; '+content);
                    return success(index,Sorcery.required[modulename]);
                  },function(){
                    throw new Error('Unable to load module "'+modulename+'"!');
                  });
                };
                for (var i in modulenames) {
                  var modulename=modulenames[i];
                  if (typeof(Sorcery.required[modulename])!=='undefined')
                    success(i,Sorcery.required[modulename]);
                  else
                    fetchfunc(i,modulename);
                }
              };
              
              Sorcery.define = function(modulenames,callback) {
                return Sorcery.require(modulenames,function(){
                  var ret=callback.apply(null,arguments);
                  Sorcery.required[_sorcery_require_module_name]=ret;
                  delete _sorcery_require_module_name;
                  return ret;
                });
              };
              
              if (typeof(callback)==='function')
                return callback();
            
            },function(){
              throw new Error('Unable to load Sorcery cache!');
            });
            
          });
        });
      });
      
      delete GLOBAL;
    };
  }
  
    
};
