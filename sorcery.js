if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {
    
    ENVIRONMENT_CLI : 'cli',
    ENVIRONMENT_WEB : 'web',
      
    packages : [ 'sorcery' ],

    required : [],
  
    requiring : [],

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
  
  };
  
  if (typeof module !== 'undefined' && module.exports) {
    
    Sorcery.environment = Sorcery.ENVIRONMENT_CLI;
    
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
  }
  
    
};
