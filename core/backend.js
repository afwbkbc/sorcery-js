//var config = require('./config.js');

var core=null;

if (typeof(GLOBAL.Sorcery) === 'undefined') {
  
  GLOBAL.Sorcery = {
  
    packages : [
      'sorcery',
    ],
    
    require : function(modulenames,callback) {
      //console.log('REQUIRING',modulenames);
      if (typeof(modulenames)==='string')
        modulenames=[modulenames];
      var look_in=['../app/','../packages/'];
      for (var i in this.packages)
        look_in.push('../packages/'+this.packages[i]+'/');
      var collectedmodules=[];
      var self=this;
      var innerloop=function() {
        while (modulenames.length) {
          var modulename=modulenames[0];
          modulenames=modulenames.splice(1);
          if (typeof(self.required[modulename])==='undefined') {
            //console.log('NEED MODULE',modulename);
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
              //console.log('RESOLVED TO',modulepath);
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
        //console.log('REQUIRE COMPLETED',collectedmodules,callback);
        callback.apply(null,collectedmodules);
      };
      innerloop();
    },
    
    define : function(modulenames,callback) {
      var modulepath=arguments.callee.caller.arguments[2].id;
      var modulename=this.requiring[modulepath];
      if (modulename) {
        //console.log('DEFINING',modulename,modulenames,callback);
        Sorcery.require(modulenames,function(){
          //console.log('CALLBACK',callback,arguments);
          var ret=callback.apply(null,arguments);
          Sorcery.required[modulename]=ret;
          //console.log('DEFINED',modulename,ret);
        });
        delete this.requiring[modulepath];
      }
    },
    
    required : [],
    
    requiring : []
    
  };

  exports={
      Sorcery:GLOBAL.Sorcery,
  };
  
};

// INIT STUFF


